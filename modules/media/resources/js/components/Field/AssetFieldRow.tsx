import { TooltipButton } from '@shared/components/ui/tooltip-button';
import { Pencil, Trash2 } from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { FileIcon } from '../Icons/FileIcon';
import { AssetImagePreview } from '../UI/AssetImagePreview';

interface AssetFieldRowProps {
    asset: MediaAsset;
    readOnly?: boolean;
    canEdit?: boolean;
    showFilename?: boolean;
    onEdit?: (asset: MediaAsset) => void;
    onRemove?: (asset: MediaAsset) => void;
    className?: string;
    'data-id'?: string;
}

export function AssetFieldRow({
    asset,
    readOnly = false,
    canEdit = true,
    showFilename = true,
    onEdit,
    onRemove,
    className,
    'data-id': dataId,
}: AssetFieldRowProps) {
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
        if (asset.mime_type === 'image/svg+xml') {
            return asset.url;
        }
        return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <tr className={`bg-background hover:bg-muted/50 cursor-grab ${className || ''}`} data-id={dataId}>
            <td className="flex flex-wrap items-center p-2" style={{ width: '100%' }}>
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded">
                    {isImage || canShowSvg ? (
                        <AssetImagePreview src={thumbnailUrl} alt={asset.title || asset.filename} compact fit={canShowSvg ? 'contain' : 'cover'} />
                    ) : (
                        <FileIcon extension={asset.extension} className="h-6 w-6" />
                    )}
                </div>

                {showFilename && (
                    <button
                        type="button"
                        className="ml-2 flex-1 truncate text-left text-sm"
                        aria-label="Edit Asset"
                        onClick={handleEdit}
                        disabled={readOnly || !canEdit}
                    >
                        {asset.title || asset.filename}
                    </button>
                )}
            </td>

            <td className="w-8 p-0 text-right align-middle">
                {!readOnly && (
                    <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                            <TooltipButton
                                tooltip="Edit Asset"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-600 hover:text-gray-900"
                                onClick={handleEdit}
                            >
                                <Pencil className="h-4 w-4" />
                            </TooltipButton>
                        )}

                        <TooltipButton
                            tooltip="Remove Asset"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-600 hover:text-red-600"
                            onClick={handleRemove}
                        >
                            <Trash2 className="h-4 w-4" />
                        </TooltipButton>
                    </div>
                )}
            </td>
        </tr>
    );
}
