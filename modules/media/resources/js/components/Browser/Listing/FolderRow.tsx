import { MediaFolder } from '@media/types/media';
import { RowActionButton } from '@shared/components/row-action-button';
import { Edit, Folder, Trash2 } from 'lucide-react';
import { useMediaMove } from '../MediaMoveContext';

interface FolderRowProps {
    folder: MediaFolder;
    canEdit: boolean;
    onSelected: (folder: MediaFolder) => void;
    onEditing: (folder: MediaFolder) => void;
    onDeleting: (folder: MediaFolder) => void;
}

export function FolderRow({ folder, canEdit, onSelected, onEditing, onDeleting }: FolderRowProps) {
    const move = useMediaMove();
    return (
        <tr {...move?.folderProps(folder.path)} className="media-folder-target border-border hover:bg-accent border-b">
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
            <td className="text-muted-foreground hidden p-3 text-right text-sm md:table-cell">—</td>
            <td className="text-muted-foreground hidden p-3 text-sm md:table-cell">{new Date(folder.updated_at).toLocaleDateString()}</td>
            <td className="p-3">
                {canEdit && (
                    <div className="flex items-center justify-end gap-2">
                        <RowActionButton label={`Rename ${folder.title}`} tooltip="Rename folder" onClick={() => onEditing(folder)}>
                            <Edit className="size-4" />
                        </RowActionButton>
                        <RowActionButton label={`Delete ${folder.title}`} tooltip="Delete folder" destructive onClick={() => onDeleting(folder)}>
                            <Trash2 className="size-4" />
                        </RowActionButton>
                    </div>
                )}
            </td>
        </tr>
    );
}
