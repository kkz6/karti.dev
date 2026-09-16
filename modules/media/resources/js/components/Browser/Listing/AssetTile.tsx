import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Download, Edit, ImageOff, MoreHorizontal, Trash2 } from 'lucide-react';
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
    const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);

    const isSelected = selectedAssets.includes(asset.id);

    const handleCheckboxChange = (checked: boolean) => {
        if (checked) {
            onSelected(asset.id);
        } else {
            onDeselected(asset.id);
        }
    };

    const handleDoubleClick = () => {
        if (canEdit) {
            onEditing(asset.id);
        } else {
            onDoubleClicked(asset);
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
            return asset.thumbnail_url;
        }
        if (asset.is_image) {
            return asset.url;
        }
        return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <div data-selected={isSelected} className="asset-tile border-border bg-card text-card-foreground group rounded-lg border transition-shadow hover:shadow-md">
            <div className="relative">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                        aria-label={`Select ${asset.filename}`}
                        checked={isSelected}
                        onCheckedChange={handleCheckboxChange}
                        className="bg-card/90"
                    />
                </div>

                {/* Actions Dropdown */}
                <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${asset.filename}`} className="bg-card/90">
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
                                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
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
                <button
                    type="button"
                    aria-label={`Open ${asset.title || asset.filename}`}
                    className="asset-thumb-container focus-visible:outline-ring bg-muted relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-t-lg focus-visible:outline-2"
                    onClick={handleDoubleClick}
                >
                    {thumbnailUrl && failedThumbnail !== thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedThumbnail(thumbnailUrl)} />
                    ) : thumbnailUrl ? (
                        <span className="text-muted-foreground flex flex-col items-center gap-2 px-3 text-center text-xs">
                            <ImageOff aria-hidden="true" className="h-8 w-8" />
                            Preview unavailable
                        </span>
                    ) : (
                        <FileIcon extension={asset.extension} className="text-muted-foreground h-8 w-8" />
                    )}
                </button>
            </div>

            {/* Asset Info */}
            <div className="asset-meta p-2">
                <button
                    type="button"
                    title={asset.title || asset.filename}
                    className="asset-filename text-foreground hover:text-primary focus-visible:outline-ring mb-1 block w-full cursor-pointer truncate text-left text-sm font-medium focus-visible:outline-2"
                    onClick={handleDoubleClick}
                >
                    {asset.title || asset.filename}
                </button>
                <div className="asset-details text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
                    <span className="truncate">{asset.extension.toUpperCase()}</span>
                    <span className="shrink-0">{formatFileSize(asset.size)}</span>
                </div>
            </div>
        </div>
    );
};
