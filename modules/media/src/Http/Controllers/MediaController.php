<?php

declare(strict_types=1);

namespace Modules\Media\Http\Controllers;

use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
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
        $subdirectories = array_diff(Storage::directories($path), $this->ignore);

        $key            = trim('root.'.implode('.', explode('/', $path)), "\.");
        $subdirectories = Cache::remember("media.manager.folders.{$key}", 60 * 60 * 24, function () use ($subdirectories) {
            $modified = Media::whereIn('directory', $subdirectories)
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

            return $modified->sortBy('name')->values();
        });

        return response([
            'subdirectories' => $subdirectories->sortBy('name'),
            'media' => MediaResource::collection($mediaPaginated->items()),
            'page_count' => $mediaPaginated->lastPage()
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

        foreach ($media as $m) {
            $model = $this->uploader
                ->toDirectory($path)
                ->fromSource($m);
            if ($data->isNotEmpty()) {
                $model->beforeSave(function (Media $m) use ($data) {
                    $m->fill($data->toArray());
                });
            }
            if ($c = Media::inDirectory($path)->where('filename', $m->getClientOriginalName())->count()) {
                $model = $model->useFilename("{$m->getClientOriginalName()}_{$c}");
            }

            $response[] = $model->upload();
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
    public function destroy($id)
    {
        return response(Media::destroy($id));
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
            'media_ids'   => 'required|array',
            'media_ids.*' => 'required|integer|exists:media,id',
            'destination' => 'required|string',
        ]);

        $mediaIds    = $request->input('media_ids');
        $destination = $this->manager->verifyDirectory(trim($request->input('destination'), '/'));

        $moved = collect();

        foreach ($mediaIds as $id) {
            $media = Media::find($id);
            if ($media && $media->directory !== $destination) {
                $media->move($destination);
                $moved->push(new MediaResource($media->fresh()));
            }
        }

        return response([
            'success' => true,
            'message' => "Moved {$moved->count()} file(s) successfully",
            'media'   => $moved,
        ]);
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
            $fullPath = $media->getDiskPath();

            // Delete old file if exists
            if ($diskInstance->exists($fullPath)) {
                $diskInstance->delete($fullPath);
            }

            // Save the new file
            $diskInstance->put($fullPath, $decodedImage);

            // Update the media record
            $media->update([
                'size' => strlen($decodedImage),
            ]);

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

        $filename = $saveData->name;
        $diskInstance = Storage::disk($disk);
        $fullPath = $path ? $path.'/'.$filename : $filename;

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
