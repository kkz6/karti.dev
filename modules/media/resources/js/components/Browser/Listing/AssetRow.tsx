import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Download, Edit, FolderInput, MoreHorizontal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { MediaAsset } from '../../../types/media';
import { FileIcon } from '../../Icons/FileIcon';
import { AssetImagePreview } from '../../UI/AssetImagePreview';
import { useMediaMove } from '../MediaMoveContext';

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
    const move = useMediaMove();

    const isSelected = selectedAssets.includes(asset.id);

    const handleCheckboxChange = (checked: boolean) => {
        if (checked) {
            onSelected(asset.id);
        } else {
            onDeselected(asset.id);
        }
    };

    const handleDoubleClick = () => {
        // Open edit dialog on double-click
        onEditing(asset.id);
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
        if (asset.mime_type === 'image/svg+xml') {
            return asset.url;
        }
        return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <tr
            data-selected={isSelected}
            draggable={!!move && !move.moving}
            onDragStart={(event) => move?.start(event, asset.id)}
            onDragEnd={() => move?.end()}
            className="border-border hover:bg-accent border-b"
        >
            {/* Checkbox */}
            <td className="p-3">
                <div className="media-selection-control flex size-8 items-center justify-center">
                    <Checkbox aria-label={`Select ${asset.filename}`} checked={isSelected} onCheckedChange={handleCheckboxChange} />
                </div>
            </td>

            {/* Thumbnail */}
            <td className="p-3">
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded" onDoubleClick={handleDoubleClick}>
                    {thumbnailUrl || asset.is_image ? (
                        <AssetImagePreview src={thumbnailUrl} alt={asset.title || asset.filename} compact />
                    ) : (
                        <FileIcon extension={asset.extension} className="h-6 w-6" />
                    )}
                </div>
            </td>

            {/* Title */}
            <td className="p-3">
                <button
                    type="button"
                    className="text-foreground hover:text-primary focus-visible:outline-ring block max-w-full truncate text-left text-sm font-medium focus-visible:outline-2"
                    onClick={() => (canEdit ? handleEdit() : onDoubleClicked(asset))}
                >
                    {asset.title || asset.filename}
                </button>
                <div className="text-muted-foreground text-xs">{asset.extension.toUpperCase()}</div>
            </td>

            {/* File Size */}
            <td className="text-muted-foreground hidden p-3 text-sm md:table-cell">{formatFileSize(asset.size)}</td>

            {/* Date Modified */}
            <td className="text-muted-foreground hidden p-3 text-sm md:table-cell">{formatDate(asset.updated_at)}</td>

            {/* More Actions */}
            <td className="p-3">
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${asset.filename}`}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && (
                            <>
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Edit />
                                    Edit details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                                    <Trash2 />
                                    Delete
                                </DropdownMenuItem>
                                {move && (
                                    <DropdownMenuItem disabled={move.moving} onSelect={() => move.open([asset.id])}>
                                        <FolderInput />
                                        Move to folder
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                        <DropdownMenuItem onClick={handleDownload}>
                            <Download className="size-4" aria-hidden="true" />
                            Download
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
};
