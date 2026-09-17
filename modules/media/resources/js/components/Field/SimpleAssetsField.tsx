import { Button } from '@shared/components/ui/button';
import { FormControl, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { AssetPickerDialog } from '../UI/AssetPickerDialog';
import { cn } from '@shared/lib/utils';
import { FolderOpen, GripVertical, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AssetFieldProps, AssetUpload, DisplayMode } from '../../types/asset-field';
import { AssetBrowser } from '../Browser/AssetBrowser';
import { AssetEditor } from '../Editor/AssetEditor';
import { AssetFieldLoading } from './AssetFieldLoading';
import { Uploader, UploaderRef } from '../Upload/Uploader';
import { Uploads } from '../Upload/Uploads';
import { AssetFieldRow } from './AssetFieldRow';
import { AssetFieldTile } from './AssetFieldTile';
import { AssetDropOverlay } from './AssetDropOverlay';
import { MediaAsset } from '../../types/media';
import { MediaService } from '../../services/MediaService';
import { includeAsset, uniqueAssetIds } from '../../utils/asset-selection';
import { toast } from 'sonner';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SimpleAssetsField({ name, data = [], config = {}, required = false, readOnly = false, onChange, onError }: AssetFieldProps) {
    const uploaderRef = useRef<UploaderRef>(null);
    const displayMode: DisplayMode = config.mode || 'grid';
    const mediaService = useRef(new MediaService());

    let isInFormContext = false;
    try {
        const context = useFormContext();
        isInFormContext = !!context;
    } catch {
        isInFormContext = false;
    }

    const [assetIds, setAssetIds] = useState<string[]>([]);
    const [loadedAssets, setLoadedAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [draggingFile, setDraggingFile] = useState(false);
    const [uploads, setUploads] = useState<AssetUpload[]>([]);
    const loadedAssetIdsRef = useRef<string[]>([]);

    const maxFiles = config.max_files || 0;
    const maxFilesReached = maxFiles > 0 && assetIds.length >= maxFiles;
    const isEmpty = loadedAssets.length === 0;
    const isSolo = maxFiles === 1;

    useEffect(() => {
        const ids = Array.isArray(data) ? uniqueAssetIds(data) : [];

        setAssetIds(ids);
    }, [data]);

    useEffect(() => {
        if (assetIds.length === 0) {
            setLoadedAssets([]);
            loadedAssetIdsRef.current = [];
            return;
        }

        const currentlyLoadedIds = loadedAssetIdsRef.current;
        const missingIds = assetIds.filter(id => !currentlyLoadedIds.includes(id));

        if (missingIds.length > 0) {
            loadAssetsFromIds(assetIds);
        } else {
            setLoadedAssets(prevAssets => {
                return assetIds.map((id) => prevAssets.find((asset) => asset.id === id)).filter(Boolean) as MediaAsset[];
            });
        }
    }, [assetIds]);

    const loadAssetsFromIds = async (ids: string[]) => {
        if (ids.length === 0) {
            setLoadedAssets([]);
            loadedAssetIdsRef.current = [];
            return;
        }

        try {
            setLoading(true);
            const assets = await mediaService.current.getAssetsByIds(ids);
            const orderedAssets = ids.map(id => assets.find(asset => asset.id.toString() === id.toString())).filter(Boolean) as MediaAsset[];

            if (orderedAssets.length < ids.length) {
                const missingIds = ids.filter(id => !orderedAssets.find(asset => asset.id.toString() === id.toString()));
                const isDebugMode = import.meta.env.DEV || window.location.hostname === 'localhost';

                if (isDebugMode) {
                    console.warn('Some media assets were not found:', missingIds);
                }

                toast.warning(`Some media assets (IDs: ${missingIds.join(', ')}) no longer exist and have been removed`);

                const validIds = orderedAssets.map(asset => asset.id);
                updateParentWithIds(validIds);
            }

            setLoadedAssets(orderedAssets);
            loadedAssetIdsRef.current = orderedAssets.map(asset => asset.id);
        } catch (error) {
            console.error('Error loading assets:', error);
            onError?.('Failed to load assets');
            setLoadedAssets([]);
            loadedAssetIdsRef.current = [];
        } finally {
            setLoading(false);
        }
    };

    const updateParentWithIds = (newIds: string[]) => {
        const uniqueIds = uniqueAssetIds(newIds);
        setAssetIds(uniqueIds);
        onChange?.(uniqueIds);
    };

    const [showAssetEditor, setShowAssetEditor] = useState(false);
    const [editedAssetId, setEditedAssetId] = useState<string | null>(null);

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

    const handleUploadComplete = (asset: MediaAsset) => {
        const newIds = [...assetIds, asset.id];
        updateParentWithIds(newIds);
    };

    const handleUploadsUpdated = useCallback((newUploads: AssetUpload[]) => {
        setUploads(newUploads);
    }, []);

    const clearUpload = useCallback((uploadId: string) => {
        uploaderRef.current?.clear(uploadId);
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes('Files') || readOnly || showSelector) return;
        e.preventDefault();
        setDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        setDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
        if (readOnly || showSelector) return;
        const files = e.dataTransfer.files;
        if (files && files.length > 0 && uploaderRef.current) {
            Array.from(files).forEach((file) => {
                uploaderRef.current?.upload(file);
            });
        }
    };

    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const openSelector = () => {
        setSelectedAssetIds(uniqueAssetIds(assetIds));
        setShowSelector(true);
    };

    const closeSelector = () => {
        setShowSelector(false);
        setSelectedAssetIds([]);
    };

    const handleAssetsSelected = () => {
        updateParentWithIds(selectedAssetIds);
        closeSelector();
    };

    const handleSelectionsUpdated = (selections: string[]) => {
        setSelectedAssetIds(uniqueAssetIds(selections));
    };

    const handleAssetDoubleClicked = (asset: MediaAsset) => {
        const newIds = includeAsset(selectedAssetIds, asset.id, maxFiles);
        updateParentWithIds(newIds);
        closeSelector();
    };

    const canEdit = config.canEdit ?? true;
    const folder = config.folder || '/';
    const restrictNavigation = config.restrict || false;

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

    if (isInFormContext) {
        return (
            <FormItem>
                <FormLabel>
                    {name}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                    <div
                    className={cn('assets-fieldtype relative isolate border-input bg-background rounded-lg border', {
                        'max-files-reached': maxFilesReached,
                        empty: isEmpty,
                        solo: isSolo,
                    })}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {loading && <AssetFieldLoading />}

                    {draggingFile && !showSelector && !readOnly && <AssetDropOverlay />}

                    {!loading && (
                        <>
                            {!maxFilesReached && (
                                <div className={cn('manage-assets border-border p-4', !isEmpty && 'border-b')}>
                                    <div className="flex flex-wrap items-center gap-2">
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
                                </div>
                            )}

                            {!showSelector && (
                                <Uploader
                                    ref={uploaderRef}
                                    path={folder}
                                    onUploadComplete={handleUploadComplete}
                                    onUpdated={handleUploadsUpdated}
                                    onError={onError}
                                />
                            )}

                            {uploads.length > 0 && <Uploads uploads={uploads} onClearUpload={clearUpload} />}

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

                            {!isEmpty && isSolo && loadedAssets[0] && (
                                <div className="asset-solo-container p-4">
                                    <div className="w-32">
                                        <AssetFieldTile
                                            asset={loadedAssets[0]}
                                            readOnly={readOnly}
                                            canEdit={canEdit}
                                            onEdit={handleAssetEdit}
                                            onRemove={handleAssetRemove}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <AssetPickerDialog
                        open={showSelector}
                        title={`Select ${name}`}
                        selectedCount={selectedAssetIds.length}
                        confirmLabel="Use selection"
                        allowEmpty
                        onClose={closeSelector}
                        onConfirm={handleAssetsSelected}
                        onClear={() => setSelectedAssetIds([])}
                    >
                        <AssetBrowser
                            selectedPath={folder}
                            selectedAssets={selectedAssetIds}
                            maxFiles={maxFiles}
                            canEdit={canEdit}
                            restrictNavigation={restrictNavigation}
                            onSelectionsUpdated={handleSelectionsUpdated}
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                        />
                    </AssetPickerDialog>

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
                            const updatedAssets = loadedAssets.map(a => a.id === asset.id ? asset : a);
                            setLoadedAssets(updatedAssets);
                        }}
                        onDeleted={(assetId) => {
                            setShowAssetEditor(false);
                            setEditedAssetId(null);
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

    return (
        <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {name}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <div
                className={cn('assets-fieldtype relative isolate border-input bg-background rounded-lg border', {
                    'max-files-reached': maxFilesReached,
                    empty: isEmpty,
                    solo: isSolo,
                })}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {loading && <AssetFieldLoading />}

                {draggingFile && !showSelector && !readOnly && <AssetDropOverlay />}

                {!loading && (
                    <>
                        {!maxFilesReached && (
                            <div className={cn('manage-assets border-border p-4', !isEmpty && 'border-b')}>
                                <div className="flex flex-wrap items-center gap-2">
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
                            </div>
                        )}

                        {!showSelector && (
                            <Uploader
                                ref={uploaderRef}
                                path={folder}
                                onUploadComplete={handleUploadComplete}
                                onUpdated={handleUploadsUpdated}
                                onError={onError}
                            />
                        )}

                        {uploads.length > 0 && <Uploads uploads={uploads} onClearUpload={clearUpload} />}

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

                        {!isEmpty && isSolo && loadedAssets[0] && (
                            <div className="asset-solo-container p-4">
                                <div className="w-32">
                                    <AssetFieldTile
                                        asset={loadedAssets[0]}
                                        readOnly={readOnly}
                                        canEdit={canEdit}
                                        onEdit={handleAssetEdit}
                                        onRemove={handleAssetRemove}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                <AssetPickerDialog
                        open={showSelector}
                        title={`Select ${name}`}
                        selectedCount={selectedAssetIds.length}
                        confirmLabel="Use selection"
                        allowEmpty
                        onClose={closeSelector}
                        onConfirm={handleAssetsSelected}
                        onClear={() => setSelectedAssetIds([])}
                    >
                        <AssetBrowser
                            selectedPath={folder}
                            selectedAssets={selectedAssetIds}
                            maxFiles={maxFiles}
                            canEdit={canEdit}
                            restrictNavigation={restrictNavigation}
                            onSelectionsUpdated={handleSelectionsUpdated}
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                        />
                    </AssetPickerDialog>

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
                        const updatedAssets = loadedAssets.map(a => a.id === asset.id ? asset : a);
                        setLoadedAssets(updatedAssets);
                    }}
                    onDeleted={(assetId) => {
                        setShowAssetEditor(false);
                        setEditedAssetId(null);
                        const newIds = assetIds.filter(id => id !== assetId);
                        updateParentWithIds(newIds);
                    }}
                    allowDeleting={canEdit}
                />
            </div>
        </div>
    );
}
