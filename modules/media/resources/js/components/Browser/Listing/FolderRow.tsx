import { MediaFolder } from '@media/types/media';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Edit, Folder, MoreHorizontal, Trash2 } from 'lucide-react';

interface FolderRowProps {
    folder: MediaFolder;
    canEdit: boolean;
    onSelected: (folder: MediaFolder) => void;
    onEditing: (folder: MediaFolder) => void;
    onDeleting: (folder: MediaFolder) => void;
}

export function FolderRow({ folder, canEdit, onSelected, onEditing, onDeleting }: FolderRowProps) {
    return (
        <tr className="border-border hover:bg-accent border-b">
            <td className="p-3" />
            <td className="p-3">
                <button
                    type="button"
                    className="text-muted-foreground focus-visible:outline-ring flex size-8 items-center justify-center rounded focus-visible:outline-2"
                    aria-label={`Open ${folder.title}`}
                    onClick={() => onSelected(folder)}
                >
                    <Folder className="size-5" />
                </button>
            </td>
            <td className="min-w-0 p-3">
                <button
                    type="button"
                    onClick={() => onSelected(folder)}
                    className="text-foreground hover:text-primary focus-visible:outline-ring block max-w-full truncate text-left text-sm font-medium focus-visible:outline-2"
                >
                    {folder.title}
                </button>
                <span className="text-muted-foreground text-xs">Folder</span>
            </td>
            <td className="text-muted-foreground hidden p-3 text-sm md:table-cell">—</td>
            <td className="text-muted-foreground hidden p-3 text-sm md:table-cell">{new Date(folder.updated_at).toLocaleDateString()}</td>
            <td className="p-3">
                {canEdit && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${folder.title}`}>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onEditing(folder)}>
                                <Edit />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => onDeleting(folder)}>
                                <Trash2 />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </td>
        </tr>
    );
}
