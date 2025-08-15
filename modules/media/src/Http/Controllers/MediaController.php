<?php

declare(strict_types=1);

namespace Modules\Media\Http\Controllers;

use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Modules\Media\DTOs\MediaAssetData;
use Modules\Media\Exceptions\MediaManagerException;
use Modules\Media\Exceptions\MediaUpload\ConfigurationException;
use Modules\Media\Exceptions\MediaUpload\FileExistsException;
use Modules\Media\Exceptions\MediaUpload\FileNotFoundException;
use Modules\Media\Exceptions\MediaUpload\FileNotSupportedException;
use Modules\Media\Exceptions\MediaUpload\FileSizeException;
use Modules\Media\Exceptions\MediaUpload\ForbiddenException;
use Modules\Media\Exceptions\MediaUpload\InvalidHashException;
use Modules\Media\Http\Requests\MediaStoreRequest;
use Modules\Media\Http\Requests\MediaUpdateRequest;
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
    public function index(Request $request, string $path = '')
    {
        $diskString = $this->manager->verifyDisk($request->disk);
        $disk       = Storage::disk($diskString);
        $path       = $this->manager->verifyDirectory($diskString, $path);

        $media          = Media::inDirectory($diskString, $path)->paginate(20)->toArray();
        $subdirectories = array_diff($disk->directories($path), $this->ignore);

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

        return response(['subdirectories' => $subdirectories->sortBy('name'), 'media' => $media['data'], 'page_count' => $media['last_page']]);
    }

    /**
     * Upload a piece of media to a specified path, and create associated media entry representing it.
     * @param MediaStoreRequest $request
     * @return ResponseFactory|Application|Response|object
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
        $disk     = $this->manager->verifyDisk($request->disk);
        $path     = $this->manager->verifyDirectory($disk, trim($request->path, '/'));
        $response = [];

        foreach ($media as $m) {
            $model = $this->uploader
                ->toDestination($disk, $path)
                ->fromSource($m);
            if ($data->isNotEmpty()) {
                $model->beforeSave(function (Media $m) use ($data) {
                    $m->fill($data->toArray());
                });
            }
            if ($c = Media::inDirectory($disk, $path)->where('filename', $m->getClientOriginalName())->count()) {
                $model = $model->useFilename("{$m->getClientOriginalName()}_{$c}");
            }

            $response[] = $model->upload();
        }

        return response($response);
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
        $media     = Media::findOrFail($id);
        $mediaData = MediaAssetData::fromModel($media);

        return response($mediaData->toArray());
    }

    /**
     * Move or rename a specified media entry.
     */
    public function update(MediaUpdateRequest $request)
    {
        $valid = $request->validated();
        $media = Media::find($valid['id']);
        $disk  = $this->manager->verifyDisk($valid['disk']);
        $path  = $this->manager->verifyDirectory($disk, $valid['path'] ?? $media->directory);

        if (! $request->has('path')) {
            $details = $request->only(['title', 'alt', 'caption', 'credit']);
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
        $id    = $request->id;

        return response(Media::destroy($id));
    }

    /**
     * Adjust the size of a specified piece of media, while preserving aspect ratio
     * Note: Does **not** preserve original image
     */
    public function resize(Request $request)
    {
        $id    = $request->id;
        $size  = $request->size;
        // TODO: add exceptions for this that will detect incorrect function calls
        $function = $request->function ?? MediaManager::RESIZE_WIDTH;

        $image = Media::findOrFail($id);
        $this->manager->resize($image, $size, $function);
    }
}
