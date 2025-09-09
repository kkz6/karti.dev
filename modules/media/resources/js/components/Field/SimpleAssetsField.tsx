import { Button } from '@shared/components/ui/button';
import { FormControl, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog';
import { cn } from '@shared/lib/utils';
import { FolderOpen, Upload, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAssetsField } from '../../hooks/useAssetsField';
import { AssetFieldProps, DisplayMode } from '../../types/asset-field';
import { LoadingGraphic } from '@media/components';
import { AssetBrowser } from '@media/components';
import { Uploader, UploaderRef } from '../Upload/Uploader';
import { Uploads } from '../Upload/Uploads';
import { AssetFieldRow } from './AssetFieldRow';
import { AssetFieldTile } from './AssetFieldTile';
import { MediaAsset } from '../../types/media';
import { MediaService, MediaFile } from '../../services/MediaService';

export function SimpleAssetsField({ name, data = [], config = {}, required = false, readOnly = false, onChange, onError }: AssetFieldProps) {
    const uploaderRef = useRef<UploaderRef>(null);
    const displayMode: DisplayMode = config.mode || 'grid';

    // Try to get the form context, but don't fail if it's not there
    let isInFormContext = false;
    try {
        const context = useFormContext();
        isInFormContext = !!context;
    } catch {
        // Not in a form context, that's fine
        isInFormContext = false;
    }

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
        addAsset,
        removeAsset,
        openSelector,
        closeSelector,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleUploadComplete,
        handleUploadsUpdated,
        clearUpload,
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
    const handleAssetEdit = (asset: MediaAsset) => {
        // TODO: Implement asset editing modal
        console.log('Edit asset:', asset);
    };

    const handleUploadFile = () => {
        uploaderRef.current?.browse();
    };

    const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
    const mediaService = useRef(new MediaService());

    // Helper function to convert MediaFile to MediaAsset
    const convertMediaFileToAsset = (file: MediaFile): MediaAsset => ({
        id: file.id.toString(),
        disk: file.disk,
        directory: file.directory,
        filename: file.filename,
        title: file.basename || file.filename,
        extension: file.extension,
        mime_type: file.mime_type,
        aggregate_type: file.aggregate_type,
        size: file.size,
        created_at: file.created_at,
        updated_at: file.updated_at,
        url: file.url,
        path: file.directory,
        container_id: 'public', // Default container
        is_image: file.aggregate_type === 'image',
        is_audio: file.aggregate_type === 'audio',
        is_video: file.aggregate_type === 'video',
        thumbnail_url: file.aggregate_type === 'image' ? file.url : undefined,
        formatted_size: `${(file.size / 1024).toFixed(1)} KB`, // Simple formatting
    });

    const handleAssetsSelected = async () => {
        if (selectedAssetIds.length > 0) {
            try {
                // Fetch asset data for selected IDs
                const assetPromises = selectedAssetIds.map(id => mediaService.current.getFileDetails(Number(id)));
                const assetData = await Promise.all(assetPromises);
                const validAssets = assetData.filter(asset => asset !== null);

                // Convert MediaFile objects to MediaAsset objects and add to current assets
                validAssets.forEach(asset => addAsset(convertMediaFileToAsset(asset)));
            } catch (error) {
                console.error('Error fetching asset data:', error);
            }
        }
        closeSelector();
    };

    const handleSelectionsUpdated = (selections: string[]) => {
        setSelectedAssetIds(selections);
    };

    const handleAssetDoubleClicked = async (asset: MediaAsset) => {
        addAsset(asset);
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

    // Render with form components if in form context, otherwise render standalone
    if (isInFormContext) {
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
                            {uploads.length > 0 && <Uploads uploads={uploads} onClearUpload={clearUpload} />}

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
                                    <div className="w-32">
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
                                </div>
                            )}
                        </>
                    )}

                    {/* Asset selector dialog */}
                    <Dialog open={showSelector} onOpenChange={closeSelector}>
                        <DialogContent className="max-w-6xl sm:max-w-6xl md:max-w-6xl lg:max-w-6xl h-[85vh] flex flex-col p-0 gap-0">
                            <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
                                <DialogTitle>Select {name}</DialogTitle>
                            </DialogHeader>

                            <div className="flex-1 overflow-hidden p-0">
                                <AssetBrowser
                                    selectedContainer={container}
                                    selectedPath={folder}
                                    selectedAssets={selectedAssetIds}
                                    maxFiles={maxFiles}
                                    canEdit={canEdit}
                                    restrictNavigation={restrictNavigation}
                                    onSelectionsUpdated={handleSelectionsUpdated}
                                    onAssetDoubleClicked={handleAssetDoubleClicked}
                                />
                            </div>

                            <DialogFooter className="px-4 py-3 border-t flex-shrink-0 bg-muted/20">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeSelector}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAssetsSelected}
                                    disabled={selectedAssetIds.length === 0}
                                >
                                    Select
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
    }

    // Standalone version without form context
    return (
        <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {name}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
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
                        {uploads.length > 0 && <Uploads uploads={uploads} onClearUpload={clearUpload} />}

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
                                <div className="w-32">
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
                            </div>
                        )}
                    </>
                )}

                {/* Asset selector dialog */}
                <Dialog open={showSelector} onOpenChange={closeSelector}>
                    <DialogContent className="max-w-6xl sm:max-w-6xl md:max-w-6xl lg:max-w-6xl h-[85vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
                            <DialogTitle>Select {name}</DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden p-0">
                            <AssetBrowser
                                selectedContainer={container}
                                selectedPath={folder}
                                selectedAssets={selectedAssetIds}
                                maxFiles={maxFiles}
                                canEdit={canEdit}
                                restrictNavigation={restrictNavigation}
                                onSelectionsUpdated={handleSelectionsUpdated}
                                onAssetDoubleClicked={handleAssetDoubleClicked}
                            />
                        </div>

                        <DialogFooter className="px-4 py-3 border-t flex-shrink-0 bg-muted/20">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeSelector}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAssetsSelected}
                                disabled={selectedAssetIds.length === 0}
                            >
                                Select
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
