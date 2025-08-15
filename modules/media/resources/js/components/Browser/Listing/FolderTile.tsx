import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Edit, Folder, MoreHorizontal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { MediaFolder } from '../../../types/media';

interface FolderTileProps {
    folder: MediaFolder;
    canEdit: boolean;
    onSelected: (folder: MediaFolder) => void;
    onEditing: (folder: MediaFolder) => void;
    onDeleting: (folder: MediaFolder) => void;
}

export const FolderTile: React.FC<FolderTileProps> = ({ folder, canEdit, onSelected, onEditing, onDeleting }) => {
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    const handleDoubleClick = () => {
        onSelected(folder);
    };

    const handleEdit = () => {
        onEditing(folder);
        setDropdownOpen(false);
    };

    const handleDelete = () => {
        onDeleting(folder);
        setDropdownOpen(false);
    };

    return (
        <div className="folder-tile group cursor-pointer rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="relative">
                {/* Actions Dropdown */}
                {canEdit && (
                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 bg-white/80 p-0 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Folder Icon */}
                <div
                    className="folder-thumb-container flex aspect-square items-center justify-center rounded-t-lg bg-blue-50 dark:bg-blue-900"
                    onDoubleClick={handleDoubleClick}
                >
                    <Folder className="h-10 w-10 text-blue-500" />
                </div>
            </div>

            {/* Folder Info */}
            <div className="folder-meta p-2" onDoubleClick={handleDoubleClick}>
                <div className="folder-name truncate text-xs font-medium text-gray-900 dark:text-gray-100">{folder.title}</div>
                <div className="folder-details text-xs text-gray-500 dark:text-gray-400">Folder</div>
            </div>
        </div>
    );
};
