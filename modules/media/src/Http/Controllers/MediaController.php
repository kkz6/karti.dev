<?php

declare(strict_types=1);

namespace Modules\Media\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Modules\Media\DTOs\MediaAssetData;
use Modules\Media\Exceptions\MediaManagerException;
use Modules\Media\Http\Requests\MediaUpdateRequest;
use Modules\Media\Models\Media;
use Modules\Media\Support\MediaManager;
use Modules\Media\Support\MediaUploader;
use Modules\Shared\Http\Controllers\BaseController;

class MediaController extends BaseController
{
    protected $model;

    protected $ignore = ['conversions'];

    public function __construct(
        protected readonly MediaManager $manager,
        protected readonly MediaUploader $uploader,
        array $ignore = []
    ) {
        $this->model    = config('media-manager.model');
        $this->ignore   = array_merge($ignore, $this->ignore);
    }

    /**
     * @throws MediaManagerException
     */
    public function index(Request $request, string $path = '')
    {
        $diskString = $this->manager->verifyDisk($request->disk);
        $disk       = Storage::disk($diskString);
        $path       = $this->manager->verifyDirectory($diskString, $path);
        $model      = config('media-manager.model');

        $media          = $model::inDirectory($diskString, $path)->paginate(20)->toArray();
        $subdirectories = array_diff($disk->directories($path), $this->ignore);

        $key            = trim('root.' . implode('.', explode('/', $path)), "\.");
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

        return response(['subdirectories' => $subdirectories->sortBy('name'), 'media' => $media['data'], 'page_count' => $media['last_page']]);
    }

    /**
     * Retrieve details about a specific piece of media.
     *
     * @param mixed $id
     *
     * @return \Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Http\Response
     */
    public function show($id)
    {
        $media     = $this->model::findOrFail($id);
        $mediaData = MediaAssetData::fromModel($media);

        return response($mediaData->toArray());
    }

    /**
     * Move or rename a specified media entry.
     */
    public function update(MediaUpdateRequest $request)
    {
        $model = config('media-manager.model');
        $valid = $request->validated();

        $media = $model::find($valid['id']);
        $disk  = $this->manager->verifyDisk($valid['disk']);
        $path  = $this->manager->verifyDirectory($disk, $valid['path'] ?? $media->directory);

        if (! $request->has('path')) {
            $details = $request->only(['title', 'alt', 'caption', 'credit']);
            // Can't call fill due to backwards compatibility (fill doesn't trigger mutators)... Use loop instead.
            foreach ($details as $attribute => $detail) {
                $media->$attribute = $detail;
            }
        }

        if ($path != $media->directory) {
            $media->move($path, $valid['rename'] ?? null);
        }

        $media->save();

        return response($media->fresh());
    }

    /**
     * Delete media
     */
    public function destroy(Request $request)
    {
        $model = config('media-manager.model');
        $id    = $request->id;

        return response($model::destroy($id));
    }

    /**
     * Upload files to the media manager
     *
     * @throws MediaManagerException
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'path' => 'nullable|string',
        ]);

        $diskString = $this->manager->verifyDisk($request->disk ?? 'public');
        $path       = $request->path ?? '';

        try {
            $file = $request->file('file');

            // Use the MediaUploader to handle the upload
            $media = $this->uploader
                ->fromSource($file)
                ->toDisk($diskString)
                ->toDirectory($path)
                ->upload();

            return response()->json([
                'success' => true,
                'media'   => $media,
                'message' => 'File uploaded successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Adjust the size of a specified piece of media, while preserving aspect ratio
     * Note: Does **not** preserve original image
     */
    public function resize(Request $request)
    {
        $model = config('media-manager.model');
        $id    = $request->id;
        $size  = $request->size;
        // TODO: add exceptions for this that will detect incorrect function calls
        $function = $request->function ?? MediaManager::RESIZE_WIDTH;

        $image = $model::findOrFail($id);
        $this->manager->resize($image, $size, $function);
    }
}
