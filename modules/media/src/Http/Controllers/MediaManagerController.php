<?php

namespace Modules\Media\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Modules\Media\Exceptions\MediaManagerException;
use Modules\Media\Models\Media;
use Modules\Media\Support\MediaManager;

readonly class MediaManagerController
{
    public function __construct(protected MediaManager $manager) {}

    public function index()
    {
        return Inertia::render('media::index');
    }

    /**
     * Create a folder on disk with the given name
     *
     * @throws MediaManagerException
     */
    public function create(Request $request)
    {
        $path = $request->path;

        if (Storage::exists($path)) {
            throw MediaManagerException::directoryAlreadyExists($path);
        }
        Storage::makeDirectory($path);
        $this->invalidateFolderCache($path);

        return response([
            'success' => true,
            'path'    => $path,
        ]);
    }

    /**
     * Move an entire directory, and it's contained media to another folder. Supports renaming folders as well.
     *
     * Note: An edge case bug exists where if you move a folder from the root, which contains folders with the
     * containing folder's name as substrings for those folders, the action of moving will also rename those subfolders
     * resulting faulty move results
     **
     * @throws MediaManagerException|\Modules\Media\Exceptions\MediaMoveException
     */
    public function update(Request $request)
    {
        $source      = $this->manager->verifyDirectory($request->source);
        $destination = trim($request->destination, '/');

        if (str_starts_with($destination, $source)) {
            throw MediaManagerException::cannotMoveDirectoryToDestination($source, $destination);
        }

        $container = collect(explode('/', $source))->last();
        $rename    = $request->rename ?? $container;
        $destination .= '/'.$rename;

        if (Storage::exists($destination)) {
            throw MediaManagerException::directoryAlreadyExists($destination);
        }

        $moved = collect();

        // get a list of directories that need to be created in the destination directory
        $directories            = Storage::allDirectories($source);
        $destinationDirectories = array_map(function ($directory) use ($source, $destination) {
            return $destination.str_replace($source, '', $directory);
        }, $directories);
        array_unshift($destinationDirectories, $destination);

        // check if a directory with the same name as root already exists in the destination directory
        if (Storage::exists($destinationDirectories[0])) {
            throw MediaManagerException::directoryAlreadyExists($destinationDirectories[0]);
        }

        // create directories in the destination directory
        foreach ($destinationDirectories as $destinationDirectory) {
            Storage::makeDirectory($destinationDirectory);
        }

        // get list of files that need to be moved
        $files = Media::where('disk', config('mediable.default_disk'))->where(function (Builder $q) use ($source) {
            $source = str_replace(['%', '_'], ['\%', '\_'], $source);
            $q->where('directory', $source);
            $q->orWhere('directory', 'like', $source.'/%');
        })->get();

        if ($files->count() > 0) {
            $files->each(function ($media) use ($source, $destination, $moved) {
                $directory = trim(str_replace($source, $destination, $media->directory), '/');
                $media->move($directory);
                $moved[] = $media->fresh();
            });
        }

        Storage::deleteDirectory($source);
        $this->invalidateFolderCache($source);
        $this->invalidateFolderCache($destination);

        return response([
            'success' => true,
            'media'   => $moved,
        ]);
    }

    /**
     * Delete the specified folder from the disk, along with its entries in Media
     *
     * @return \Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Http\Response
     *
     * @throws MediaManagerException
     */
    public function destroy(Request $request)
    {
        $path   = $this->manager->verifyDirectory($request->path);
        $parent = collect(explode('/', $path))->slice(-1)->implode('/');

        Storage::deleteDirectory($path);
        Media::where('disk', config('mediable.default_disk'))->where(function (Builder $q) use ($path) {
            $path = str_replace(['%', '_'], ['\%', '\_'], $path);
            $q->where('directory', $path);
            $q->orWhere('directory', 'like', $path.'/%');
        })->delete();
        $this->invalidateFolderCache($path);

        return response(['success' => true, 'parentFolder' => $parent]);
    }

    private function invalidateFolderCache($path)
    {
        $key = explode('/', $path);
        array_pop($key);
        $key = trim('root.'.implode('.', $key), "\.");

        Cache::forget("media.manager.folders.{$key}");
    }
}
