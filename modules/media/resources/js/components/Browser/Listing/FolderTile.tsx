import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Edit, Folder, MoreHorizontal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { MediaFolder } from '../../../types/media';
import { useMediaMove } from '../MediaMoveContext';

interface FolderTileProps {
    folder: MediaFolder;
    canEdit: boolean;
    onSelected: (folder: MediaFolder) => void;
    onEditing: (folder: MediaFolder) => void;
    onDeleting: (folder: MediaFolder) => void;
}

export const FolderTile: React.FC<FolderTileProps> = ({ folder, canEdit, onSelected, onEditing, onDeleting }) => {
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const move = useMediaMove();

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
        <div
            {...move?.folderProps(folder.path)}
            className="media-folder-target folder-tile border-border bg-card text-card-foreground group cursor-pointer rounded-lg border transition-shadow hover:shadow-md"
        >
            <div className="relative">
                {/* Actions Dropdown */}
                {canEdit && (
                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Actions for ${folder.title}`}
                                    className="bg-card/90"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Edit className="size-4" aria-hidden="true" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                    <Trash2 className="size-4" aria-hidden="true" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Folder Icon */}
                <button
                    type="button"
                    aria-label={`Open ${folder.title}`}
                    className="folder-thumb-container focus-visible:outline-ring bg-muted flex aspect-square w-full items-center justify-center rounded-t-lg focus-visible:outline-2"
                    onClick={handleDoubleClick}
                >
                    <Folder className="text-muted-foreground h-10 w-10" />
                </button>
            </div>

            {/* Folder Info */}
            <div className="folder-meta p-2">
                <button
                    type="button"
                    onClick={handleDoubleClick}
                    title={folder.title}
                    className="folder-name text-foreground hover:text-primary focus-visible:outline-ring mb-1 block w-full truncate text-left text-sm font-medium focus-visible:outline-2"
                >
                    {folder.title}
                </button>
                <div className="folder-details text-muted-foreground text-xs">Folder</div>
            </div>
        </div>
    );
};
