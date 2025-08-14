<?php

declare(strict_types=1);

namespace Modules\Media\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

use Modules\Shared\Http\Controllers\BaseController;

class MediaController extends BaseController
{
    /**
     * Display the media manager page
     */
    public function index(): Response
    {
        return Inertia::render('media::index');
    }

    /**
     * Get files for a specific path
     */
    public function getFiles()
    {
        // TODO: Implement actual file listing logic
        // For now, return mock data
        return response()->json([
            'path' => request('path', '/'),
            'items' => [
                [
                    'name' => 'example-folder',
                    'storage_path' => '/storage/example-folder',
                    'path' => '/storage/example-folder',
                    'type' => 'folder',
                    'size' => 0,
                    'last_modified' => now()->toISOString(),
                    'last_modified_formated' => now()->format('M d, Y H:i'),
                    'visibility' => 'public',
                ],
                [
                    'name' => 'example-image.jpg',
                    'storage_path' => '/storage/example-image.jpg',
                    'path' => '/storage/example-image.jpg',
                    'type' => 'image/jpeg',
                    'size' => 1024000,
                    'last_modified' => now()->subDays(2)->toISOString(),
                    'last_modified_formated' => now()->subDays(2)->format('M d, Y H:i'),
                    'visibility' => 'public',
                ],
                [
                    'name' => 'document.pdf',
                    'storage_path' => '/storage/document.pdf',
                    'path' => '/storage/document.pdf',
                    'type' => 'application/pdf',
                    'size' => 2048000,
                    'last_modified' => now()->subWeek()->toISOString(),
                    'last_modified_formated' => now()->subWeek()->format('M d, Y H:i'),
                    'visibility' => 'private',
                ],
            ],
        ]);
    }

    /**
     * Upload files
     */
    public function upload()
    {
        // TODO: Implement actual file upload logic
        return response()->json([
            'success' => true,
            'message' => 'Files uploaded successfully',
            'data' => [],
        ]);
    }

    /**
     * Toggle file lock
     */
    public function lock()
    {
        // TODO: Implement file locking logic
        return response()->json([
            'success' => true,
            'locked' => true,
            'message' => 'File locked successfully',
        ]);
    }

    /**
     * Toggle file visibility
     */
    public function visibility()
    {
        // TODO: Implement visibility toggle logic
        return response()->json([
            'success' => true,
            'visibility' => 'public',
            'message' => 'Visibility updated successfully',
        ]);
    }

    /**
     * Get locked files list
     */
    public function lockedList()
    {
        // TODO: Implement locked files listing
        return response()->json([
            'locked_files' => [],
        ]);
    }
}
