<?php

declare(strict_types=1);

namespace Modules\Media\Http\Controllers;

use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Modules\Media\DTO\ImageEditorSaveData;
use Modules\Media\Exceptions\MediaManagerException;
use Modules\Media\Exceptions\MediaMoveException;
use Modules\Media\Exceptions\MediaUpload\ConfigurationException;
use Modules\Media\Exceptions\MediaUpload\FileExistsException;
use Modules\Media\Exceptions\MediaUpload\FileNotFoundException;
use Modules\Media\Exceptions\MediaUpload\FileNotSupportedException;
use Modules\Media\Exceptions\MediaUpload\FileSizeException;
use Modules\Media\Exceptions\MediaUpload\ForbiddenException;
use Modules\Media\Exceptions\MediaUpload\InvalidHashException;
use Modules\Media\Exceptions\MediaUploadException;
use Modules\Media\Http\Requests\MediaStoreRequest;
use Modules\Media\Http\Requests\MediaUpdateRequest;
use Modules\Media\Http\Resources\MediaResource;
use Modules\Media\Models\Media;
use Modules\Media\Support\MediaManager;
use Modules\Media\Support\MediaUploader;
use Modules\Shared\Http\Controllers\BaseController;

class MediaController extends BaseController
{
    protected $ignore = ['conversions'];

    public function __construct(
        protected readonly MediaManager $manager,
        protected readonly MediaUploader $uploader,
        array $ignore = []
    ) {
        $this->ignore   = array_merge($ignore, $this->ignore);
    }

    /**
     * @throws MediaManagerException
     */
    public function index(string $path = '')
    {
        $path       = $this->manager->verifyDirectory($path);

        $mediaPaginated = Media::inDirectory($path)->whereNull('original_media_id')->with('variants')->paginate(20);
        $disk           = config('mediable.default_disk');
        $subdirectories = array_diff(Storage::disk($disk)->directories($path), $this->ignore);

        // Read current directories on every refresh, including newly created empty folders.
        $modified = Media::where('disk', $disk)->whereIn('directory', $subdirectories)
            ->selectRaw('directory, max(updated_at) as timestamp')
            ->groupBy('directory')
            ->get()
            ->map(function ($directory) {
                return [
                    'name'      => $directory->directory,
                    'timestamp' => $directory->timestamp,
                ];
            });
        foreach (array_diff($subdirectories, $modified->pluck('name')->toArray()) as $leftover) {
            $modified[] = ['name' => $leftover, 'timestamp' => 'N/A'];
        }

        $subdirectories = $modified->sortBy('name')->values();

        return response([
            'subdirectories' => $subdirectories,
            'media'          => MediaResource::collection($mediaPaginated->items()),
            'page_count'     => $mediaPaginated->lastPage(),
        ]);
    }

    /**
     * Upload a piece of media to a specified path, and create associated media entry representing it.
     *
     * @return ResponseFactory|Application|Response|object
     *
     * @throws MediaManagerException
     * @throws ConfigurationException
     * @throws FileExistsException
     * @throws FileNotFoundException
     * @throws FileNotSupportedException
     * @throws FileSizeException
     * @throws ForbiddenException
     * @throws InvalidHashException
     */
    public function create(MediaStoreRequest $request)
    {
        $media    = is_array($request->file) ? $request->file : [$request->file];
        $data     = collect($request->only(['title', 'alt', 'caption', 'credit']));
        $path     = $this->manager->verifyDirectory(trim($request->path ?? '', '/'));
        $response = [];

        try {
            foreach ($media as $m) {
                $model = $this->uploader
                    ->toDirectory($path)
                    ->fromSource($m);

                if ($data->isNotEmpty()) {
                    $model->beforeSave(function (Media $m) use ($data) {
                        $m->fill($data->toArray());
                    });
                }

                $response[] = new MediaResource($model->upload()->load('variants'));
            }
        } catch (FileExistsException) {
            return response()->json([
                'message' => "A file named '{$m->getClientOriginalName()}' already exists in this folder.",
            ], 409);
        } catch (FileSizeException) {
            return response()->json([
                'message' => 'This file exceeds the 25 MB upload limit.',
            ], 413);
        } catch (MediaUploadException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response($response);
    }

    /**
     * Retrieve details about a specific piece of media or multiple media items.
     *
     * @param mixed $id
     */
    public function show(Request $request, $id = null)
    {
        $ids = $request->query('ids');

        if ($ids && is_array($ids)) {
            $media = Media::whereIn('id', $ids)->with('variants')->get();

            return MediaResource::collection($media);
        }

        if ($ids && is_string($ids)) {
            $idsArray = explode(',', $ids);
            $media    = Media::whereIn('id', $idsArray)->with('variants')->get();

            return MediaResource::collection($media);
        }

        $media = Media::with('variants')->findOrFail($id);
        if (! $request->boolean('metadata_only')) {
            app(\Modules\Media\Support\PhotoMetadata::class)->queue($media);
        }

        return new MediaResource($media);
    }

    /**
     * Move or rename a specified media entry.
     *
     *
     * @throws MediaManagerException
     * @throws MediaMoveException
     */
    public function update(MediaUpdateRequest $request, string $media)
    {
        $valid = $request->validated();
        $media = Media::find($media);
        $path  = $this->manager->verifyDirectory($valid['path'] ?? $media->directory);

        // Update metadata fields
        $details = $request->only(['title', 'alt', 'caption', 'credit', 'focus']);
        foreach ($details as $attribute => $detail) {
            $media->$attribute = $detail;
        }

        // Handle moving if path has changed
        if ($path != $media->directory) {
            $media->move($path, $valid['rename'] ?? null);
        }

        $media->save();

        $updatedMedia = $media->fresh();

        return response(['asset' => new MediaResource($updatedMedia)]);
    }

    /**
     * Delete media
     *
     * @param mixed $id
     */
    public function destroy($id, \Modules\Media\Support\MediaUsage $usage)
    {
        $media = Media::findOrFail($id);
        abort_unless($media->isOriginal(), 422, 'Generated previews are managed with their original file.');
        $result = $usage->forMedia($media);
        if ($result['usages']) {
            return response()->json(['message' => 'This file is still used. Replace or remove the listed references before deleting it.', 'assets' => [$result]], 409);
        }

        return response($media->delete());
    }

    public function usage(Request $request, \Modules\Media\Support\MediaUsage $usage)
    {
        $data = $request->validate(['media_ids' => ['required', 'array', 'min:1', 'max:100'], 'media_ids.*' => ['required', 'integer', 'distinct', 'exists:media,id']]);

        return response()->json(['assets' => Media::whereIn('id', $data['media_ids'])->with('variants')->get()->map(fn ($media) => $usage->forMedia($media))]);
    }

    public function deleteUnused(Request $request, \Modules\Media\Support\MediaUsage $usage)
    {
        $data  = $request->validate(['media_ids' => ['required', 'array', 'min:1', 'max:100'], 'media_ids.*' => ['required', 'integer', 'distinct', 'exists:media,id']]);
        $files = Media::whereIn('id', $data['media_ids'])->with('variants')->get();
        abort_if($files->contains(fn ($file) => ! $file->isOriginal()), 422, 'Generated previews are managed with their original file.');
        $deleted = [];
        $kept    = [];
        $errors  = [];
        foreach ($files as $file) {
            // Recheck on submission: usage may have changed since the dialog opened.
            try {
                $result = $usage->forMedia($file);
                if ($result['usages']) {
                    $kept[] = $result;

                    continue;
                }
                $file->delete();
                $deleted[] = (string) $file->id;
            } catch (\Throwable $exception) {
                report($exception);
                $errors[] = ['id' => (string) $file->id, 'message' => 'Could not delete '.($file->title ?: $file->filename).'. Please retry.'];
            }
        }

        return response()->json(['deleted_ids' => $deleted, 'kept' => $kept, 'errors' => $errors]);
    }

    /**
     * Download media file
     *
     * @param mixed $id
     */
    public function download($id)
    {
        $media = Media::findOrFail($id);
        $path  = $media->getDiskPath();

        if (! Storage::exists($path)) {
            abort(404, 'File not found');
        }

        $filename = $media->filename.'.'.$media->extension;
        $contents = Storage::get($path);

        return response($contents)
            ->header('Content-Type', $media->mime_type)
            ->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
    }

    /**
     * Move multiple media files to a new directory
     *
     * @throws MediaManagerException
     * @throws MediaMoveException
     */
    public function move(Request $request)
    {
        $request->validate([
            'media_ids'   => 'required|array|min:1|max:100',
            'media_ids.*' => 'required|integer|distinct|exists:media,id',
            'destination' => 'required|string',
            'disk'        => ['sometimes', 'string', \Illuminate\Validation\Rule::in(config('mediable.allowed_disks', ['public']))],
        ]);

        $disk        = $request->input('disk', config('mediable.default_disk'));
        $destination = app(\Modules\Media\Support\MediaDirectories::class)->validate($disk, $request->string('destination')->toString());
        $files       = Media::whereIn('id', $request->input('media_ids'))->get();
        $storage     = Storage::disk($disk);
        $targets     = [];
        // Check the whole batch before moving anything. Never overwrite a destination file.
        foreach ($files as $media) {
            abort_if($media->disk !== $disk || ! $media->isOriginal(), 422, 'Only original files from this media library can be moved.');
            abort_unless($storage->exists($media->getDiskPath()), 422, "The original file {$media->basename} is missing.");
            if ($media->directory === $destination) {
                continue;
            }
            $target = trim($destination.'/'.$media->basename, '/');
            abort_if(isset($targets[$target]) || $storage->exists($target), 409, "A file named {$media->basename} already exists in the destination. Nothing was moved.");
            $targets[$target] = true;
        }

        $moved = [];
        try {
            foreach ($files as $media) {
                if ($media->directory !== $destination) {
                    $media->move($destination);
                }
                $moved[] = (string) $media->id;
            }
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json(['message' => 'Could not move all files. Completed moves have been refreshed; retry the remaining files.', 'moved_ids' => $moved], 409);
        }

        return response([
            'success'   => true,
            'message'   => 'Files moved successfully.',
            'moved_ids' => $moved,
        ]);
    }

    public function folders(Request $request)
    {
        $request->validate([
            'disk' => ['sometimes', 'string', \Illuminate\Validation\Rule::in(config('mediable.allowed_disks', ['public']))],
            'path' => 'nullable|string',
        ]);
        $disk    = $request->input('disk', config('mediable.default_disk'));
        $path    = app(\Modules\Media\Support\MediaDirectories::class)->validate($disk, $request->input('path') ?? '');
        $folders = collect(Storage::disk($disk)->directories($path))
            ->reject(fn ($directory) => explode('/', $directory)[0] === 'conversions')
            ->sort()->values()->map(fn ($directory) => ['path' => $directory, 'title' => basename($directory)]);

        return response()->json(['folders' => $folders]);
    }

    /**
     * Save edited image from image editor
     *
     * @return ResponseFactory|Response
     *
     * @throws FileNotSupportedException
     * @throws MediaManagerException
     */
    public function saveEditedImage(ImageEditorSaveData $saveData)
    {
        // Decode base64 image data
        $imageData = $saveData->data;
        if (strpos($imageData, 'data:') === 0) {
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
        }
        $decodedImage = base64_decode($imageData);

        if ($decodedImage === false) {
            return response(['success' => false, 'message' => 'Invalid image data'], 400);
        }

        if ($saveData->overwrite && $saveData->assetId) {
            // When overwriting, update the existing media record
            $media = Media::find($saveData->assetId);

            if (! $media) {
                return response(['success' => false, 'message' => 'Original asset not found'], 404);
            }

            // Use the media's disk and path
            $diskInstance = Storage::disk($media->disk);
            $fullPath     = $media->getDiskPath();

            // Delete old file if exists
            if ($diskInstance->exists($fullPath)) {
                $diskInstance->delete($fullPath);
            }

            // Save the new file
            $diskInstance->put($fullPath, $decodedImage);

            // Update the media record
            $media->forceFill([
                'size' => strlen($decodedImage),
            ])->save();
            $media->saveConversions(force: true);

            return response([
                'success' => true,
                'message' => 'Image saved successfully',
                'asset'   => new MediaResource($media->fresh()),
            ]);
        }

        // For new copies, use default disk from config
        $disk = config('mediable.default_disk');
        $path = trim($saveData->path ?? '', '/');

        // Verify directory exists if path is specified
        if ($path) {
            $path = $this->manager->verifyDirectory($path);
        }

        $filename     = $saveData->name;
        $diskInstance = Storage::disk($disk);
        $fullPath     = $path ? $path.'/'.$filename : $filename;

        if ($diskInstance->exists($fullPath)) {
            $pathInfo  = pathinfo($filename);
            $basename  = $pathInfo['filename'];
            $extension = $pathInfo['extension'] ?? '';
            $counter   = 1;

            do {
                $newBasename = $basename.'_'.$counter;
                $filename    = $extension ? $newBasename.'.'.$extension : $newBasename;
                $fullPath    = $path ? $path.'/'.$filename : $filename;
                $counter++;
            } while ($diskInstance->exists($fullPath));
        }

        // Save the file
        $diskInstance->put($fullPath, $decodedImage);

        // Create media record
        $pathInfo  = pathinfo($filename);
        $filesize  = strlen($decodedImage);
        $extension = $pathInfo['extension'] ?? '';

        // Infer aggregate type using the uploader's logic
        $aggregateType = $this->uploader->inferAggregateType($saveData->mimeType, $extension);

        $media = Media::forceCreate([
            'disk'              => $disk,
            'directory'         => $path,
            'filename'          => $pathInfo['filename'],
            'extension'         => $extension,
            'mime_type'         => $saveData->mimeType,
            'aggregate_type'    => $aggregateType,
            'size'              => $filesize,
            'title'             => $pathInfo['filename'],
            'alt'               => null,
            'caption'           => null,
            'credit'            => null,
            'custom_properties' => [],
        ]);

        return response([
            'success' => true,
            'message' => 'Image copy saved successfully',
            'asset'   => new MediaResource($media),
        ]);
    }
}
