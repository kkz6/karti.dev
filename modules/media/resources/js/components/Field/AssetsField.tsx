import { Button } from '@shared/components/ui/button';
import { FormControl, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { cn } from '@shared/lib/utils';
import { FolderOpen, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MediaService } from '../../services/MediaService';
import { AssetFieldProps, AssetUpload, DisplayMode } from '../../types/asset-field';
import { MediaAsset } from '../../types/media';
import { LoadingGraphic } from '../UI/LoadingGraphic';
import { Selector } from '../UI/Selector';
import { Uploader, UploaderRef } from '../Upload/Uploader';
import { Uploads } from '../Upload/Uploads';
import { AssetFieldRow } from './AssetFieldRow';
import { AssetFieldTile } from './AssetFieldTile';

// Extend Array prototype for swapping (similar to Vue implementation)
declare global {
    interface Array<T> {
        swap(x: number, y: number): Array<T>;
    }
}

Array.prototype.swap = function <T>(this: T[], x: number, y: number): T[] {
    const b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
};

export function AssetsField({ name, data = [], config = {}, required = false, readOnly = false, onChange, onError }: AssetFieldProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const assetContainerRef = useRef<HTMLDivElement | HTMLTableSectionElement>(null);
    const uploaderRef = useRef<UploaderRef>(null);

    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [uploads, setUploads] = useState<AssetUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);
    const [draggingFile, setDraggingFile] = useState(false);
    const [innerDragging, setInnerDragging] = useState(false);
    const [displayMode, setDisplayMode] = useState<DisplayMode>(config.mode || 'grid');

    const mediaService = new MediaService();

    // Configuration computed values
    const container = config.container;
    const folder = config.folder || '/';
    const containerSpecified = !!config.container;
    const restrictNavigation = config.restrict || false;
    const maxFiles = config.max_files || 0;
    const maxFilesReached = maxFiles > 0 && assets.length >= maxFiles;
    const soloAsset = maxFiles === 1;
    const expanded = assets.length > 0;
    const canEdit = config.canEdit ?? true;

    // Load assets from data
    const loadAssets = useCallback(
        async (assetData: MediaAsset[]) => {
            if (!assetData || !assetData.length) {
                setAssets([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // If assets already have full data, use them directly
                if (assetData[0] && typeof assetData[0] === 'object' && 'url' in assetData[0]) {
                    setAssets(assetData);
                } else {
                    // For now, we'll assume asset data is already in the correct format
                    // TODO: Implement proper asset loading by IDs when the API supports it
                    console.warn('Asset loading by IDs not yet implemented');
                    setAssets([]);
                }
            } catch (error) {
                console.error('Error loading assets:', error);
                onError?.('Unable to load assets');
                setAssets([]);
            } finally {
                setLoading(false);
            }
        },
        [mediaService, onError],
    );

    // Initialize assets
    useEffect(() => {
        loadAssets(data);
    }, [data, loadAssets]);

    // Update parent when assets change
    useEffect(() => {
        onChange(assets);
    }, [assets, onChange]);

    // Drag & drop handlers
    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (!innerDragging) {
                setDraggingFile(true);
            }
        },
        [innerDragging],
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);

        const files = e.dataTransfer.files;
        if (files.length > 0 && uploaderRef.current) {
            Array.from(files).forEach((file) => {
                uploaderRef.current?.upload(file);
            });
        }
    }, []);

    // Asset management handlers
    const handleAssetRemove = useCallback((asset: MediaAsset) => {
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    }, []);

    const handleAssetEdit = useCallback((asset: MediaAsset) => {
        // TODO: Implement asset editing modal
        console.log('Edit asset:', asset);
    }, []);

    // Selector handlers
    const openSelector = useCallback(() => {
        setShowSelector(true);
    }, []);

    const closeSelector = useCallback(() => {
        setShowSelector(false);
    }, []);

    const handleAssetsSelected = useCallback(
        (selections: string[]) => {
            // TODO: Convert asset IDs to MediaAsset objects
            // For now, we'll just close the selector
            console.log('Selected asset IDs:', selections);
            closeSelector();
        },
        [closeSelector],
    );

    // Upload handlers
    const handleUploadFile = useCallback(() => {
        uploaderRef.current?.browse();
    }, []);

    const handleUploadComplete = useCallback((asset: MediaAsset) => {
        setAssets((prev) => [...prev, asset]);
    }, []);

    const handleUploadsUpdated = useCallback((newUploads: AssetUpload[]) => {
        setUploads(newUploads);
    }, []);

    const handleUploadError = useCallback(
        (error: string) => {
            onError?.(error);
        },
        [onError],
    );

    // Sortable functionality (simplified - you might want to use a library like react-sortable-hoc)
    const handleSortStart = useCallback(() => {
        setInnerDragging(true);
    }, []);

    const handleSortEnd = useCallback((oldIndex: number, newIndex: number) => {
        setAssets((prev) => {
            const newAssets = [...prev];
            return newAssets.swap(oldIndex, newIndex);
        });
        setInnerDragging(false);
    }, []);

    return (
        <FormItem>
            <FormLabel>
                {name}
                {required && <span className="ml-1 text-red-500">*</span>}
            </FormLabel>
            <FormControl>
                <div
                    ref={rootRef}
                    className={cn('assets-fieldtype border-input bg-background rounded-lg border', {
                        'max-files-reached': maxFilesReached,
                        empty: !assets.length,
                        solo: soloAsset,
                    })}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {loading && <LoadingGraphic />}

                    {/* Drag notification */}
                    {containerSpecified && !innerDragging && draggingFile && !showSelector && (
                        <div className="drag-notification flex flex-col items-center justify-center p-8 text-center">
                            <Upload className="text-muted-foreground mb-2 h-8 w-8" />
                            <h3 className="text-lg font-medium">Drop to upload</h3>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Upload controls */}
                            {!maxFilesReached && (
                                <div className="manage-assets border-border border-b p-4">
                                    {!containerSpecified ? (
                                        <div className="flex items-center text-yellow-600">
                                            <X className="mr-2 h-4 w-4" />
                                            No asset container specified
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="outline" onClick={openSelector} disabled={readOnly}>
                                                <FolderOpen className="mr-2 h-4 w-4" />
                                                Browse assets
                                            </Button>
                                            <Button type="button" variant="outline" onClick={handleUploadFile} disabled={readOnly}>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload
                                            </Button>
                                            <span className="text-muted-foreground text-sm">or drag and drop files</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Uploader component */}
                            {containerSpecified && !showSelector && (
                                <Uploader
                                    ref={uploaderRef}
                                    container={container}
                                    path={folder}
                                    onUploadComplete={handleUploadComplete}
                                    onUpdated={handleUploadsUpdated}
                                    onError={handleUploadError}
                                />
                            )}

                            {/* Upload progress */}
                            {uploads.length > 0 && <Uploads uploads={uploads} />}

                            {/* Asset display */}
                            {expanded && !soloAsset && (
                                <>
                                    {displayMode === 'grid' ? (
                                        <div
                                            ref={assetContainerRef as React.RefObject<HTMLDivElement>}
                                            className="asset-grid-listing grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                                        >
                                            {assets.map((asset, index) => (
                                                <AssetFieldTile
                                                    key={asset.id}
                                                    asset={asset}
                                                    data-id={asset.id}
                                                    readOnly={readOnly}
                                                    canEdit={canEdit}
                                                    onEdit={handleAssetEdit}
                                                    onRemove={handleAssetRemove}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="asset-table-listing">
                                            <table className="w-full">
                                                <tbody ref={assetContainerRef as React.RefObject<HTMLTableSectionElement>}>
                                                    {assets.map((asset, index) => (
                                                        <AssetFieldRow
                                                            key={asset.id}
                                                            asset={asset}
                                                            data-id={asset.id}
                                                            readOnly={readOnly}
                                                            canEdit={canEdit}
                                                            onEdit={handleAssetEdit}
                                                            onRemove={handleAssetRemove}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Solo asset display */}
                            {expanded && soloAsset && (
                                <div className="asset-solo-container p-4">
                                    {assets.map((asset) => (
                                        <AssetFieldTile
                                            key={asset.id}
                                            asset={asset}
                                            readOnly={readOnly}
                                            canEdit={canEdit}
                                            onEdit={handleAssetEdit}
                                            onRemove={handleAssetRemove}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Asset selector modal */}
                    {showSelector && (
                        <Selector
                            container={container}
                            folder={folder}
                            restrictNavigation={restrictNavigation}
                            selected={assets.map((a) => a.id)}
                            maxFiles={maxFiles}
                            canEdit={canEdit}
                            onSelected={handleAssetsSelected}
                            onClosed={closeSelector}
                        />
                    )}
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
}
