import { Edit, Folder, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { MediaFolder } from '../../../types/media';
import { ActionButton } from '../../ActionButton';

interface FolderRowProps {
    folder: MediaFolder;
    canEdit: boolean;
    onSelected: (folder: MediaFolder) => void;
    onEditing: (folder: MediaFolder) => void;
    onDeleting: (folder: MediaFolder) => void;
}

export const FolderRow: React.FC<FolderRowProps> = ({ folder, canEdit, onSelected, onEditing, onDeleting }) => {
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            {/* Empty checkbox column */}
            <td className="p-3"></td>

            {/* Folder Icon */}
            <td className="p-3">
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center" onDoubleClick={handleDoubleClick}>
                    <Folder className="h-6 w-6 text-blue-500" />
                </div>
            </td>

            {/* Folder Name */}
            <td className="p-3">
                <div className="cursor-pointer text-sm font-medium text-gray-900 hover:text-blue-600" onDoubleClick={handleDoubleClick}>
                    {folder.title}
                </div>
                <div className="text-xs text-gray-500">Folder</div>
            </td>

            {/* Size (empty for folders) */}
            <td className="hidden p-3 text-sm text-gray-600 md:table-cell">-</td>

            {/* Date Modified */}
            <td className="hidden p-3 text-sm text-gray-600 md:table-cell">{formatDate(folder.updated_at)}</td>

            {/* Direct Action Buttons */}
            <td className="hidden p-3 md:table-cell">
                {canEdit && (
                    <div className="flex items-center gap-1">
                        <ActionButton action={handleEdit} icon={Edit} tooltip="Rename" variant="ghost" />
                        <ActionButton action={handleDelete} icon={Trash2} tooltip="Delete" variant="ghost" />
                    </div>
                )}
            </td>

            {/* More Actions */}
            <td className="p-3">{/* No additional actions for folders - dropdown hidden */}</td>
        </tr>
    );
};
