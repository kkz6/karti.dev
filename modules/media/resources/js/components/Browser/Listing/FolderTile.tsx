import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Folder } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { MediaFolder } from '../../../types/media';

interface FolderTileProps {
  folder: MediaFolder;
  canEdit: boolean;
  onSelected: (folder: MediaFolder) => void;
  onEditing: (folder: MediaFolder) => void;
  onDeleting: (folder: MediaFolder) => void;
}

export const FolderTile: React.FC<FolderTileProps> = ({
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

  return (
    <div className="folder-tile group bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative">
        {/* Actions Dropdown */}
        {canEdit && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
          className="folder-thumb-container aspect-square bg-blue-50 rounded-t-lg flex items-center justify-center"
          onClick={handleClick}
        >
          <Folder className="w-16 h-16 text-blue-500" />
        </div>
      </div>

      {/* Folder Info */}
      <div className="folder-meta p-3" onClick={handleClick}>
        <div className="folder-name text-sm font-medium text-gray-900 truncate">
          {folder.title}
        </div>
        <div className="folder-details text-xs text-gray-500">
          Folder
        </div>
      </div>
    </div>
  );
};
