import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { MediaAsset } from '../../../types/media';
import { FileIcon } from '../../FileIcon';

interface AssetRowProps {
  asset: MediaAsset;
  selectedAssets: string[];
  canEdit: boolean;
  onSelected: (assetId: string) => void;
  onDeselected: (assetId: string) => void;
  onEditing: (assetId: string) => void;
  onDeleting: (assetId: string) => void;
  onDoubleClicked: (asset: MediaAsset) => void;
}

export const AssetRow: React.FC<AssetRowProps> = ({
  asset,
  selectedAssets,
  canEdit,
  onSelected,
  onDeselected,
  onEditing,
  onDeleting,
  onDoubleClicked
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  const isSelected = selectedAssets.includes(asset.id);

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      onSelected(asset.id);
    } else {
      onDeselected(asset.id);
    }
  };

  const handleDoubleClick = () => {
    onDoubleClicked(asset);
  };

  const handleEdit = () => {
    onEditing(asset.id);
    setDropdownOpen(false);
  };

  const handleDelete = () => {
    onDeleting(asset.id);
    setDropdownOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getThumbnailUrl = () => {
    if (asset.thumbnail_url) {
      return asset.thumbnail_url;
    }
    if (asset.is_image) {
      return asset.url;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      {/* Checkbox */}
      <td className="p-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
        />
      </td>

      {/* Thumbnail */}
      <td className="p-3">
        <div 
          className="w-8 h-8 flex items-center justify-center rounded overflow-hidden cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={asset.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileIcon 
              extension={asset.extension} 
              className="w-6 h-6"
            />
          )}
        </div>
      </td>

      {/* Title */}
      <td className="p-3">
        <div 
          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onDoubleClick={handleDoubleClick}
        >
          {asset.title || asset.filename}
        </div>
        <div className="text-xs text-gray-500">
          {asset.extension.toUpperCase()}
        </div>
      </td>

      {/* File Size */}
      <td className="p-3 hidden md:table-cell text-sm text-gray-600">
        {formatFileSize(asset.size)}
      </td>

      {/* Date Modified */}
      <td className="p-3 hidden md:table-cell text-sm text-gray-600">
        {formatDate(asset.updated_at)}
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
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={asset.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
};
