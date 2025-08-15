<?php

declare(strict_types=1);

namespace Modules\Media\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Modules\Media\DTOs\MediaAssetData;
use Modules\Media\Exceptions\MediaManagerException;
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
     * @return \Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Http\Response
     */
    public function show($id)
    {
        $media = $this->model::findOrFail($id);
        $mediaData = MediaAssetData::fromModel($media);

        return response($mediaData->toArray());
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
}
