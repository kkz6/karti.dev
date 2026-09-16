import { TooltipButton } from '@shared/components/ui/tooltip-button';
import { cn } from '@shared/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { FileIcon } from '../Icons/FileIcon';
import { AssetImagePreview } from '../UI/AssetImagePreview';

interface AssetFieldTileProps {
    asset: MediaAsset;
    readOnly?: boolean;
    canEdit?: boolean;
    showFilename?: boolean;
    onEdit?: (asset: MediaAsset) => void;
    onRemove?: (asset: MediaAsset) => void;
    className?: string;
    'data-id'?: string;
}

export function AssetFieldTile({
    asset,
    readOnly = false,
    canEdit = true,
    showFilename = true,
    onEdit,
    onRemove,
    className,
    'data-id': dataId,
}: AssetFieldTileProps) {
    const isImage = asset.is_image;
    const canShowSvg = asset.extension === 'svg';

    const handleEdit = () => {
        if (readOnly || !canEdit) return;
        onEdit?.(asset);
    };

    const handleRemove = () => {
        if (readOnly) return;
        onRemove?.(asset);
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
        <div
            className={cn(
                'asset-tile group border-border bg-background hover:border-primary/50 relative flex flex-col rounded-lg border transition-colors',
                {
                    'is-image': isImage && !canShowSvg,
                    'is-svg': canShowSvg,
                    'is-file': !isImage && !canShowSvg,
                },
                className,
            )}
            title={asset.filename}
            data-id={dataId}
        >
            <div className="asset-thumb-container relative aspect-square overflow-hidden rounded-t-lg">
                <div className="asset-thumb bg-muted/50 absolute inset-0 flex items-center justify-center">
                    {isImage || canShowSvg ? (
                        <AssetImagePreview src={thumbnailUrl || asset.url} alt={asset.title || asset.filename} fit={canShowSvg ? 'contain' : 'cover'} />
                    ) : (
                        <FileIcon extension={asset.extension} className="h-8 w-8" />
                    )}

                    {/* Asset Controls Overlay */}
                    {!readOnly && (
                        <div className="asset-controls absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                            {canEdit && (
                                <TooltipButton
                                    tooltip="Edit Asset"
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 bg-white/90 text-gray-900 hover:bg-white"
                                    onClick={handleEdit}
                                >
                                    <Pencil className="h-4 w-4" />
                                </TooltipButton>
                            )}

                            <TooltipButton tooltip="Remove Asset" variant="destructive" size="icon" className="h-8 w-8" onClick={handleRemove}>
                                <Trash2 className="h-4 w-4" />
                            </TooltipButton>
                        </div>
                    )}
                </div>
            </div>

            {showFilename && (
                <div className="asset-meta p-3">
                    <div className="asset-filename text-foreground truncate text-sm font-medium" title={asset.title || asset.filename}>
                        {asset.title || asset.filename}
                    </div>
                </div>
            )}
        </div>
    );
}
