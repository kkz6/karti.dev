<?php

declare(strict_types=1);

namespace Modules\Media\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
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
        array $ignore = [])
    {
        $this->model    = config('media-manager.model');
        $this->ignore   = array_merge($ignore, $this->ignore);
    }

    /**
     * @param mixed $path
     *
     * @throws MediaManagerException
     */
    public function index(Request $request, $path = '')
    {
        $diskString = $this->manager->verifyDisk($request->disk);
        $disk       = Storage::disk($diskString);
        $path       = $this->manager->verifyDirectory($diskString, $path);
        $model      = config('media-manager.model');

        $media          = $model::inDirectory($diskString, $path)->paginate(20)->toArray();
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
     * Get media manager configuration
     */
    public function config()
    {
        return response()->json([
            'config' => [
                'baseUrl'      => '/admin/media',
                'hideFilesExt' => false,
                'mimeTypes'    => [
                    'image'    => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'],
                    'video'    => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
                    'audio'    => ['mp3', 'wav', 'flac', 'aac', 'ogg'],
                    'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
                    'archive'  => ['zip', 'rar', '7z', 'tar', 'gz'],
                ],
                'broadcasting'             => false,
                'gfi'                      => true,
                'ratioBar'                 => true,
                'previewFilesBeforeUpload' => true,
            ],
            'routes' => [
                'files'       => route('admin.media.index'),
                'config'      => route('admin.media.config'),
                'upload'      => '/admin/media/upload',
                'lock'        => '/admin/media/lock',
                'visibility'  => '/admin/media/visibility',
                'locked_list' => '/admin/media/locked',
            ],
            'translations' => [
                'upload'         => 'Upload',
                'new_folder'     => 'New Folder',
                'delete'         => 'Delete',
                'rename'         => 'Rename',
                'move'           => 'Move',
                'edit'           => 'Edit',
                'search'         => 'Search files...',
                'no_files_found' => 'No files found',
                'bulk_select'    => 'Bulk Select',
                'cancel'         => 'Cancel',
                'download'       => 'Download',
                'show_info'      => 'Show Info',
                'hide_info'      => 'Hide Info',
            ],
        ]);
    }

    /**
     * Create a folder on disk with the given name
     *
     * @return \Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Http\Response
     *
     * @throws MediaManagerException
     */
    public function create(Request $request)
    {
        $disk = $this->manager->verifyDisk($request->disk);
        $path = $request->path;

        if (Storage::disk($disk)->exists($path)) {
            throw MediaManagerException::directoryAlreadyExists($disk, $path);
        }

        Storage::disk($disk)->makeDirectory($path);
        $this->invalidateFolderCache($path);

        return response([
            'success' => true,
            'path'    => $path,
        ]);
    }

    private function invalidateFolderCache($path)
    {
        $key = explode('/', $path);
        array_pop($key);
        $key = trim('root.'.implode('.', $key), "\.");

        Cache::forget("media.manager.folders.{$key}");
    }
}
