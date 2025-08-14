import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { MediaAsset } from '../../../types/media';
import { FileIcon } from '../../FileIcon';

interface AssetTileProps {
  asset: MediaAsset;
  selectedAssets: string[];
  canEdit: boolean;
  onSelected: (assetId: string) => void;
  onDeselected: (assetId: string) => void;
  onEditing: (assetId: string) => void;
  onDeleting: (assetId: string) => void;
  onDoubleClicked: (asset: MediaAsset) => void;
}

export const AssetTile: React.FC<AssetTileProps> = ({
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
    <div className="asset-tile group bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="relative">
        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className="bg-white/80 backdrop-blur-sm"
          />
        </div>

        {/* Actions Dropdown */}
        {canEdit && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
          </div>
        )}

        {/* Thumbnail */}
        <div 
          className="asset-thumb-container aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden cursor-pointer"
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
              className="w-12 h-12 text-gray-400"
            />
          )}
        </div>
      </div>

      {/* Asset Info */}
      <div className="asset-meta p-3">
        <div className="asset-filename text-sm font-medium text-gray-900 truncate mb-1">
          {asset.title || asset.filename}
        </div>
        <div className="asset-details text-xs text-gray-500 space-y-1">
          <div>{asset.extension.toUpperCase()}</div>
          <div>{formatFileSize(asset.size)}</div>
          {asset.dimensions && (
            <div>{asset.dimensions.width} × {asset.dimensions.height}</div>
          )}
        </div>
      </div>
    </div>
  );
};
