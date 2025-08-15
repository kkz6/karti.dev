import { Button } from '@shared/components/ui/button';
import { ChevronRight, Folder } from 'lucide-react';
import React from 'react';
import { MediaFolder } from '../../types/media';

interface BreadcrumbsProps {
    path: string;
    folder: MediaFolder | null;
    folders: MediaFolder[];
    onNavigated: (folder: MediaFolder) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, folder, folders, onNavigated }) => {
    const getPathParts = (): string[] => {
        let parts = ['/'];
        if (path === '/' || path === null) {
            return parts;
        }
        if (folder && folder.path.length > 1) {
            let folderPath = folder.path.substring(1);
            return parts.concat(folderPath.split('/'));
        } else if (folder) {
            return parts.concat(folder.path.split('/'));
        }
        return parts;
    };

    const selectFolder = (partIndex: number) => {
        const pathParts = getPathParts();
        const selectedPath = partIndex === 0 ? '/' : pathParts.slice(1, partIndex + 1).join('/');

        // Create a fake folder object for navigation
        const targetFolder: MediaFolder = {
            uuid: '', // You might need to track this properly
            path: selectedPath,
            title: selectedPath === '/' ? 'Root' : pathParts[partIndex],
            parent_path: partIndex === 0 ? null : pathParts.slice(1, partIndex).join('/') || '/',
            container_id: folder?.container_id || '',
            created_at: '',
            updated_at: '',
        };

        onNavigated(targetFolder);
    };

    const pathParts = getPathParts();

    return (
        <div className="breadcrumbs flex items-center border-t bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            {pathParts.map((part, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="mx-0.5 h-4 w-4 text-gray-400" />}
                    <Button variant="ghost" size="sm" onClick={() => selectFolder(index)} className="flex items-center gap-1 px-2 text-sm">
                        <Folder className="h-4 w-4" />
                        {part === '/' ? '' : part}
                    </Button>
                </React.Fragment>
            ))}
        </div>
    );
};
