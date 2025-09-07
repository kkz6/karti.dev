import { TooltipButton } from '@shared/components/ui/tooltip-button';
import { cn } from '@shared/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MediaAsset } from '../../types/media';
import { FileIcon } from '../Icons/FileIcon';

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
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const tileRef = useRef<HTMLDivElement>(null);

    const isImage = asset.is_image;
    const canShowSvg = asset.extension === 'svg';
    const canBeTransparent = ['png', 'svg'].includes(asset.extension.toLowerCase());

    const handleEdit = () => {
        if (readOnly || !canEdit) return;
        onEdit?.(asset);
    };

    const handleRemove = () => {
        if (readOnly) return;
        onRemove?.(asset);
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoaded(false);
    };

    // Initialize lightbox for images if needed
    useEffect(() => {
        if (isImage && tileRef.current) {
            // You can add lightbox initialization here if needed
            // Similar to the Vue implementation's makeZoomable function
        }
    }, [isImage, imageLoaded]);

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
            ref={tileRef}
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
                <div
                    className={cn('asset-thumb flex h-full w-full items-center justify-center', {
                        'bg-checkered': canBeTransparent,
                    })}
                >
                    {isImage ? (
                        <div className="relative h-full w-full">
                            {canShowSvg ? (
                                <div
                                    className="svg-img h-full w-full bg-contain bg-center bg-no-repeat"
                                    style={{ backgroundImage: `url(${asset.url})` }}
                                />
                            ) : (
                                <>
                                    {thumbnailUrl && (
                                        <img
                                            src={thumbnailUrl}
                                            alt={asset.title || asset.filename}
                                            className={cn('h-full w-full object-cover transition-opacity', imageLoaded ? 'opacity-100' : 'opacity-0')}
                                            onLoad={handleImageLoad}
                                            onError={handleImageError}
                                            loading="lazy"
                                        />
                                    )}
                                    {!imageLoaded && !imageError && thumbnailUrl && (
                                        <div className="bg-muted absolute inset-0 flex items-center justify-center">
                                            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                        </div>
                                    )}
                                    {(imageError || !thumbnailUrl) && (
                                        <div className="bg-muted absolute inset-0 flex items-center justify-center">
                                            <FileIcon extension={asset.extension} className="h-8 w-8" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <FileIcon extension={asset.extension} className="h-8 w-8" />
                    )}

                    {/* Asset Controls Overlay */}
                    {!readOnly && (
                        <div className="asset-controls absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
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

// Add checkered background for transparent images
const checkeredBgStyle = `
.bg-checkered {
    background-image:
        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = checkeredBgStyle;
    document.head.appendChild(styleElement);
}
