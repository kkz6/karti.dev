import { Button } from '@shared/components/ui/button';
import { FormControl, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog';
import { cn } from '@shared/lib/utils';
import { FolderOpen, Upload, X, GripVertical } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
import { MediaService } from '../../services/MediaService';
import { AssetUpload } from '../../types/asset-field';
import { AssetEditor } from '../Editor/AssetEditor';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SimpleAssetsField({ name, data = [], config = {}, required = false, readOnly = false, onChange, onError }: AssetFieldProps) {
    const uploaderRef = useRef<UploaderRef>(null);
    const displayMode: DisplayMode = config.mode || 'grid';
    const mediaService = useRef(new MediaService());

    // Try to get the form context, but don't fail if it's not there
    let isInFormContext = false;
    try {
        const context = useFormContext();
        isInFormContext = !!context;
    } catch {
        // Not in a form context, that's fine
        isInFormContext = false;
    }

    // State for managing IDs and loaded assets separately
    const [assetIds, setAssetIds] = useState<string[]>([]);
    const [loadedAssets, setLoadedAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [draggingFile, setDraggingFile] = useState(false);
    const [uploads, setUploads] = useState<AssetUpload[]>([]);
    const loadedAssetIdsRef = useRef<string[]>([]);

    // Configuration computed values
    const maxFiles = config.max_files || 0;
    const maxFilesReached = maxFiles > 0 && assetIds.length >= maxFiles;
    const containerSpecified = !!config.container;
    const isEmpty = loadedAssets.length === 0;
    const isSolo = maxFiles === 1;

    // Initialize asset IDs from data prop
    useEffect(() => {
        const ids = Array.isArray(data) ? data.map((item: any) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'number') return item.toString();
            if (typeof item === 'object' && item && item.id) return item.id.toString();
            return null;
        }).filter((id): id is string => Boolean(id)) : [];
        
        setAssetIds(ids);
    }, [data]);

    // Load full asset data when IDs change (but only if we don't already have those assets)
    useEffect(() => {
        if (assetIds.length === 0) {
            setLoadedAssets([]);
            loadedAssetIdsRef.current = [];
            return;
        }

        // Check if we need to load any new assets
        const currentlyLoadedIds = loadedAssetIdsRef.current;
        const missingIds = assetIds.filter(id => !currentlyLoadedIds.includes(id));
        
        if (missingIds.length > 0) {
            // Only load missing assets or reload all if we have missing ones
            loadAssetsFromIds(assetIds);
        } else {
            // Just reorder existing assets without API call
            setLoadedAssets(prevAssets => {
                const reorderedAssets = assetIds.map(id => prevAssets.find(asset => asset.id === id)).filter(Boolean) as MediaAsset[];
                return reorderedAssets;
            });
        }
    }, [assetIds]);

    // Function to load assets from IDs
    const loadAssetsFromIds = async (ids: string[]) => {
        if (ids.length === 0) {
            setLoadedAssets([]);
            loadedAssetIdsRef.current = [];
            return;
        }

        try {
            setLoading(true);
            const assets = await mediaService.current.getAssetsByIds(ids);
            // Maintain the order of IDs
            const orderedAssets = ids.map(id => assets.find(asset => asset.id === id)).filter(Boolean) as MediaAsset[];
            setLoadedAssets(orderedAssets);
            loadedAssetIdsRef.current = ids;
        } catch (error) {
            console.error('Error loading assets:', error);
            onError?.('Failed to load assets');
            setLoadedAssets([]);
            loadedAssetIdsRef.current = [];
        } finally {
            setLoading(false);
        }
    };

    // Update parent component with new IDs
    const updateParentWithIds = (newIds: string[]) => {
        setAssetIds(newIds);
        onChange?.(newIds);
    };

    // Asset editor state
    const [showAssetEditor, setShowAssetEditor] = useState(false);
    const [editedAssetId, setEditedAssetId] = useState<string | null>(null);

    // Asset management handlers
    const handleAssetEdit = (asset: MediaAsset) => {
        setEditedAssetId(asset.id);
        setShowAssetEditor(true);
    };

    const handleAssetRemove = (asset: MediaAsset) => {
        const newIds = assetIds.filter(id => id !== asset.id);
        updateParentWithIds(newIds);
    };

    const handleUploadFile = () => {
        uploaderRef.current?.browse();
    };

    // Upload handlers
    const handleUploadComplete = (asset: MediaAsset) => {
        const newIds = [...assetIds, asset.id];
        updateParentWithIds(newIds);
    };

    const handleUploadsUpdated = (newUploads: AssetUpload[]) => {
        setUploads(newUploads);
    };

    const clearUpload = (uploadId: string) => {
        setUploads(prev => prev.filter(upload => upload.id !== uploadId));
    };

    // Drag handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0 && uploaderRef.current) {
            Array.from(files).forEach((file) => {
                uploaderRef.current?.upload(file);
            });
        }
    };

    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end for sorting
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = assetIds.findIndex((id) => id === active.id);
            const newIndex = assetIds.findIndex((id) => id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newIds = arrayMove(assetIds, oldIndex, newIndex);
                updateParentWithIds(newIds);
            }
        }
    };


    // Asset browser handlers
    const openSelector = () => {
        setShowSelector(true);
    };

    const closeSelector = () => {
        setShowSelector(false);
        setSelectedAssetIds([]);
    };

    const handleAssetsSelected = () => {
        if (selectedAssetIds.length > 0) {
            const newIds = [...assetIds, ...selectedAssetIds];
            updateParentWithIds(newIds);
        }
        closeSelector();
    };

    const handleSelectionsUpdated = (selections: string[]) => {
        setSelectedAssetIds(selections);
    };

    const handleAssetDoubleClicked = (asset: MediaAsset) => {
        const newIds = [...assetIds, asset.id];
        updateParentWithIds(newIds);
        closeSelector();
    };

    const canEdit = config.canEdit ?? true;
    const container = config.container;
    const folder = config.folder || '/';
    const restrictNavigation = config.restrict || false;

    // Sortable Asset Tile Component with Drag Handle
    const SortableAssetTile = ({ asset }: { asset: MediaAsset }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ 
            id: asset.id,
        });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <div ref={setNodeRef} style={style} {...attributes} className="relative group">
                <AssetFieldTile
                    asset={asset}
                    data-id={asset.id}
                    readOnly={readOnly}
                    canEdit={canEdit}
                    onEdit={handleAssetEdit}
                    onRemove={handleAssetRemove}
                />
                {/* Drag Handle */}
                {!readOnly && (
                    <div 
                        {...listeners}
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-black/70 rounded p-1 hover:bg-black/80 z-10"
                        title="Drag to reorder"
                    >
                        <GripVertical className="h-3 w-3 text-white" />
                    </div>
                )}
            </div>
        );
    };

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
                    onDrop={handleDrop}
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
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext items={loadedAssets.map(asset => asset.id)} strategy={rectSortingStrategy}>
                                                <div className="asset-grid-listing grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                                    {loadedAssets.map((asset) => (
                                                        <SortableAssetTile key={asset.id} asset={asset} />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    ) : (
                                        <div className="asset-table-listing">
                                            <table className="w-full">
                                                <tbody>
                                                    {loadedAssets.map((asset) => (
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
                            {!isEmpty && isSolo && (
                                <div className="asset-solo-container p-4">
                                    <div className="w-32">
                                        {loadedAssets.map((asset) => (
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

                    {/* Asset Editor */}
                    <AssetEditor
                        assetId={editedAssetId}
                        isOpen={showAssetEditor}
                        onClose={() => {
                            setShowAssetEditor(false);
                            setEditedAssetId(null);
                        }}
                        onSaved={(asset) => {
                            setShowAssetEditor(false);
                            setEditedAssetId(null);
                            // Update the specific asset in the loaded assets list
                            const updatedAssets = loadedAssets.map(a => a.id === asset.id ? asset : a);
                            setLoadedAssets(updatedAssets);
                        }}
                        onDeleted={(assetId) => {
                            setShowAssetEditor(false);
                            setEditedAssetId(null);
                            // Remove the deleted asset from both lists
                            const newIds = assetIds.filter(id => id !== assetId);
                            updateParentWithIds(newIds);
                        }}
                        allowDeleting={canEdit}
                    />
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
                onDrop={handleDrop}
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
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext items={loadedAssets.map(asset => asset.id)} strategy={rectSortingStrategy}>
                                            <div className="asset-grid-listing grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                                {loadedAssets.map((asset) => (
                                                    <SortableAssetTile key={asset.id} asset={asset} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                ) : (
                                    <div className="asset-table-listing">
                                        <table className="w-full">
                                            <tbody>
                                                {loadedAssets.map((asset) => (
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
                        {!isEmpty && isSolo && (
                            <div className="asset-solo-container p-4">
                                <div className="w-32">
                                    {loadedAssets.map((asset) => (
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

                {/* Asset Editor */}
                <AssetEditor
                    assetId={editedAssetId}
                    isOpen={showAssetEditor}
                    onClose={() => {
                        setShowAssetEditor(false);
                        setEditedAssetId(null);
                    }}
                    onSaved={(asset) => {
                        setShowAssetEditor(false);
                        setEditedAssetId(null);
                        // Update the specific asset in the loaded assets list
                        const updatedAssets = loadedAssets.map(a => a.id === asset.id ? asset : a);
                        setLoadedAssets(updatedAssets);
                    }}
                    onDeleted={(assetId) => {
                        setShowAssetEditor(false);
                        setEditedAssetId(null);
                        // Remove the deleted asset from both lists
                        const newIds = assetIds.filter(id => id !== assetId);
                        updateParentWithIds(newIds);
                    }}
                    allowDeleting={canEdit}
                />
            </div>
        </div>
    );
}
