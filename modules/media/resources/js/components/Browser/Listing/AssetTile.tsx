import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Download, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { MediaAsset } from '../../../types/media';
import { FileIcon } from '../../Icons/FileIcon';

interface AssetTileProps {
    asset: MediaAsset;
    selectedAssets: string[];
    canEdit: boolean;
    onSelected: (assetId: string) => void;
    onDeselected: (assetId: string) => void;
    onEditing: (assetId: string) => void;
    onDeleting: (assetId: string) => void;
    onDownloading: (assetId: string) => void;
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
    onDownloading,
    onDoubleClicked,
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

    const handleSingleClick = () => {
        if (isSelected) {
            onDeselected(asset.id);
        } else {
            onSelected(asset.id);
        }
    };

    const handleEdit = () => {
        onEditing(asset.id);
        setDropdownOpen(false);
    };

    const handleDelete = () => {
        onDeleting(asset.id);
        setDropdownOpen(false);
    };

    const handleDownload = () => {
        onDownloading(asset.id);
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
            console.log('Using thumbnail_url:', asset.thumbnail_url, 'for asset:', asset.id);
            return asset.thumbnail_url;
        }
        if (asset.is_image) {
            console.log('No thumbnail, using url:', asset.url, 'for asset:', asset.id);
            return asset.url;
        }
        return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <div className="asset-tile group rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="relative">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                    <Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} className="bg-white/80 backdrop-blur-sm" />
                </div>

                {/* Actions Dropdown */}
                <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 bg-white/80 p-0 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canEdit && (
                                <>
                                    <DropdownMenuItem onClick={handleEdit}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuItem onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Thumbnail */}
                <div
                    className="asset-thumb-container flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700"
                    onClick={handleSingleClick}
                    onDoubleClick={handleDoubleClick}
                >
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={asset.title} className="h-full w-full object-cover" />
                    ) : (
                        <FileIcon extension={asset.extension} className="h-8 w-8 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Asset Info */}
            <div className="asset-meta p-2">
                <div
                    className="asset-filename mb-1 cursor-pointer truncate text-xs font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                    onClick={handleSingleClick}
                    onDoubleClick={handleDoubleClick}
                >
                    {asset.title || asset.filename}
                </div>
                <div className="asset-details space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <div>{asset.extension.toUpperCase()}</div>
                    <div>{formatFileSize(asset.size)}</div>
                </div>
            </div>
        </div>
    );
};
