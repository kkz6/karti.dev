import { MediaFolder } from '@media/types/media';
import { ChevronRight, FolderOpen } from 'lucide-react';
import React from 'react';

interface BreadcrumbsProps {
    path: string;
    folder: MediaFolder | null;
    folders: MediaFolder[];
    onNavigated: (folder: MediaFolder) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, folder, onNavigated }) => {
    const getPathParts = (): string[] => {
        const parts = ['/'];
        if (path === '/' || path === null || !folder) {
            return parts;
        }

        // Handle folder path properly
        let folderPath = folder.path;

        // If path starts with '/', remove it before splitting
        if (folderPath.startsWith('/')) {
            folderPath = folderPath.substring(1);
        }

        // If we have a valid folder path, split it and add to parts
        if (folderPath.length > 0) {
            return parts.concat(folderPath.split('/').filter((part) => part.length > 0));
        }

        return parts;
    };

    const selectFolder = (partIndex: number) => {
        const pathParts = getPathParts();
        let selectedPath: string;
        let parentPath: string | null;

        if (partIndex === 0) {
            selectedPath = '/';
            parentPath = null;
        } else {
            // Build the selected path correctly
            const pathSegments = pathParts.slice(1, partIndex + 1);
            selectedPath = pathSegments.join('/');

            // Build parent path
            if (partIndex === 1) {
                parentPath = '/';
            } else {
                parentPath = pathParts.slice(1, partIndex).join('/');
            }
        }

        // Create a folder object for navigation
        const targetFolder: MediaFolder = {
            uuid: `folder-${selectedPath}`, // Generate a UUID based on path
            path: selectedPath,
            title: selectedPath === '/' ? 'Root' : pathParts[partIndex],
            parent_path: parentPath,
            created_at: '',
            updated_at: '',
        };

        onNavigated(targetFolder);
    };

    const pathParts = getPathParts();

    return (
        <nav aria-label="Media folders" className="breadcrumbs min-w-0">
            <ol className="flex min-h-7 flex-wrap items-center gap-x-1 gap-y-1 text-xs">
                {pathParts.map((part, index) => (
                    <li key={index} className="flex max-w-full min-w-0 items-center gap-1">
                        {index > 0 && <ChevronRight className="text-muted-foreground/60 size-3 shrink-0" aria-hidden="true" />}
                        {index === pathParts.length - 1 ? (
                            <span aria-current="page" className="text-foreground inline-flex min-w-0 items-center gap-2 px-1.5 py-1 font-medium">
                                {index === 0 && <FolderOpen className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />}
                                <span className="break-all">{part === '/' ? 'All files' : part}</span>
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => selectFolder(index)}
                                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex min-w-0 items-center gap-2 rounded px-1.5 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                                {index === 0 && <FolderOpen className="size-3.5 shrink-0" aria-hidden="true" />}
                                <span className="break-all">{part === '/' ? 'All files' : part}</span>
                            </button>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};
