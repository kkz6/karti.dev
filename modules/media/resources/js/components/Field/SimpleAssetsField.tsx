import { Button } from '@shared/components/ui/button';
import { FormControl, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { cn } from '@shared/lib/utils';
import { FolderOpen, Upload, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useAssetsField } from '../../hooks/useAssetsField';
import { AssetFieldProps, DisplayMode } from '../../types/asset-field';
import { LoadingGraphic } from '../UI/LoadingGraphic';
import { Selector } from '../UI/Selector';
import { Uploader, UploaderRef } from '../Upload/Uploader';
import { Uploads } from '../Upload/Uploads';
import { AssetFieldRow } from './AssetFieldRow';
import { AssetFieldTile } from './AssetFieldTile';

export function SimpleAssetsField({ name, data = [], config = {}, required = false, readOnly = false, onChange, onError }: AssetFieldProps) {
    const uploaderRef = useRef<UploaderRef>(null);
    const displayMode: DisplayMode = config.mode || 'grid';

    const {
        assets,
        uploads,
        loading,
        showSelector,
        draggingFile,
        maxFilesReached,
        containerSpecified,
        isEmpty,
        isSolo,
        loadAssets,
        removeAsset,
        openSelector,
        closeSelector,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleUploadComplete,
        handleUploadsUpdated,
        setAllAssets,
    } = useAssetsField({
        initialAssets: data,
        config,
        onChange,
        onError,
    });

    // Load initial data
    useEffect(() => {
        if (data.length > 0) {
            loadAssets(data);
        }
    }, [data, loadAssets]);

    // Asset management handlers
    const handleAssetEdit = (asset: any) => {
        // TODO: Implement asset editing modal
        console.log('Edit asset:', asset);
    };

    const handleUploadFile = () => {
        uploaderRef.current?.browse();
    };

    const handleAssetsSelected = (selections: string[]) => {
        // TODO: Convert asset IDs to MediaAsset objects
        // For now, we'll just close the selector
        console.log('Selected asset IDs:', selections);
        closeSelector();
    };

    const handleDropFiles = (e: React.DragEvent) => {
        const files = handleDrop(e);
        if (files && files.length > 0 && uploaderRef.current) {
            Array.from(files).forEach((file) => {
                uploaderRef.current?.upload(file);
            });
        }
    };

    const canEdit = config.canEdit ?? true;
    const container = config.container;
    const folder = config.folder || '/';
    const restrictNavigation = config.restrict || false;
    const maxFiles = config.max_files || 0;

    return (
        <FormItem>
            <FormLabel>
                {name}
                {required && <span className="ml-1 text-red-500">*</span>}
            </FormLabel>
            <FormControl>
                <div
                    className={cn('assets-fieldtype border-input bg-background rounded-lg border', {
                        'max-files-reached': maxFilesReached,
                        empty: isEmpty,
                        solo: isSolo,
                    })}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropFiles}
                >
                    {loading && <LoadingGraphic />}

                    {/* Drag notification */}
                    {containerSpecified && draggingFile && !showSelector && (
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
                                    onError={onError}
                                />
                            )}

                            {/* Upload progress */}
                            {uploads.length > 0 && <Uploads uploads={uploads} />}

                            {/* Asset display */}
                            {!isEmpty && !isSolo && (
                                <>
                                    {displayMode === 'grid' ? (
                                        <div className="asset-grid-listing grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                            {assets.map((asset) => (
                                                <AssetFieldTile
                                                    key={asset.id}
                                                    asset={asset}
                                                    data-id={asset.id}
                                                    readOnly={readOnly}
                                                    canEdit={canEdit}
                                                    onEdit={handleAssetEdit}
                                                    onRemove={removeAsset}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="asset-table-listing">
                                            <table className="w-full">
                                                <tbody>
                                                    {assets.map((asset) => (
                                                        <AssetFieldRow
                                                            key={asset.id}
                                                            asset={asset}
                                                            data-id={asset.id}
                                                            readOnly={readOnly}
                                                            canEdit={canEdit}
                                                            onEdit={handleAssetEdit}
                                                            onRemove={removeAsset}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Solo asset display */}
                            {!isEmpty && isSolo && (
                                <div className="asset-solo-container p-4">
                                    {assets.map((asset) => (
                                        <AssetFieldTile
                                            key={asset.id}
                                            asset={asset}
                                            readOnly={readOnly}
                                            canEdit={canEdit}
                                            onEdit={handleAssetEdit}
                                            onRemove={removeAsset}
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
