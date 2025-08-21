import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Download, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { MediaAsset } from '../../../types/media';
import { FileIcon } from '../../Icons/FileIcon';
import { ActionButton } from '../../UI/ActionButton';

interface AssetRowProps {
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

export const AssetRow: React.FC<AssetRowProps> = ({
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
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
            {/* Checkbox */}
            <td className="p-3">
                <Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
            </td>

            {/* Thumbnail */}
            <td className="p-3">
                <div
                    className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded"
                    onClick={handleSingleClick}
                    onDoubleClick={handleDoubleClick}
                >
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={asset.title} className="h-full w-full object-cover" />
                    ) : (
                        <FileIcon extension={asset.extension} className="h-6 w-6" />
                    )}
                </div>
            </td>

            {/* Title */}
            <td className="p-3">
                <div
                    className="cursor-pointer text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                    onClick={handleSingleClick}
                    onDoubleClick={handleDoubleClick}
                >
                    {asset.title || asset.filename}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{asset.extension.toUpperCase()}</div>
            </td>

            {/* File Size */}
            <td className="hidden p-3 text-sm text-gray-600 md:table-cell dark:text-gray-400">{formatFileSize(asset.size)}</td>

            {/* Date Modified */}
            <td className="hidden p-3 text-sm text-gray-600 md:table-cell dark:text-gray-400">{formatDate(asset.updated_at)}</td>

            {/* Direct Action Buttons */}
            <td className="hidden p-3 md:table-cell">
                {canEdit && (
                    <div className="flex items-center gap-1">
                        <ActionButton action={handleEdit} icon={Edit} tooltip="Edit" variant="ghost" />
                        <ActionButton action={handleDelete} icon={Trash2} tooltip="Delete" variant="ghost" />
                    </div>
                )}
            </td>

            {/* More Actions */}
            <td className="p-3">
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
};
