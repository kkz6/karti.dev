import { MediaFolder } from '@media/types/media';
import { Button } from '@shared/components/ui/button';
import { ChevronRight, Folder } from 'lucide-react';
import React from 'react';

interface BreadcrumbsProps {
    path: string;
    folder: MediaFolder | null;
    folders: MediaFolder[];
    onNavigated: (folder: MediaFolder) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, folder, folders, onNavigated }) => {
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
            container_id: folder?.container_id || '',
            created_at: '',
            updated_at: '',
        };

        onNavigated(targetFolder);
    };

    const pathParts = getPathParts();

    return (
        <div className="breadcrumbs flex items-center bg-gray-50 p-4 dark:bg-gray-800">
            {pathParts.map((part, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="mx-0.5 h-4 w-4 text-gray-400" />}
                    <Button variant="ghost" size="sm" onClick={() => selectFolder(index)} className="flex items-center gap-1 px-2 text-sm">
                        <Folder className="h-4 w-4" />
                        {part === '/' ? 'Root' : part}
                    </Button>
                </React.Fragment>
            ))}
        </div>
    );
};
