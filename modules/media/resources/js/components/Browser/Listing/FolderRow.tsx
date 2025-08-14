import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Folder } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { MediaFolder } from '../../../types/media';

interface FolderRowProps {
  folder: MediaFolder;
  canEdit: boolean;
  onSelected: (folder: MediaFolder) => void;
  onEditing: (folder: MediaFolder) => void;
  onDeleting: (folder: MediaFolder) => void;
}

export const FolderRow: React.FC<FolderRowProps> = ({
  folder,
  canEdit,
  onSelected,
  onEditing,
  onDeleting
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const handleClick = () => {
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
        <div 
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
          onClick={handleClick}
        >
          <Folder className="w-6 h-6 text-blue-500" />
        </div>
      </td>

      {/* Folder Name */}
      <td className="p-3">
        <div 
          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onClick={handleClick}
        >
          {folder.title}
        </div>
        <div className="text-xs text-gray-500">
          Folder
        </div>
      </td>

      {/* Size (empty for folders) */}
      <td className="p-3 hidden md:table-cell text-sm text-gray-600">
        -
      </td>

      {/* Date Modified */}
      <td className="p-3 hidden md:table-cell text-sm text-gray-600">
        {formatDate(folder.updated_at)}
      </td>

      {/* Actions */}
      <td className="p-3">
        {canEdit && (
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
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
        )}
      </td>
    </tr>
  );
};
