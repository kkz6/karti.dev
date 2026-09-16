import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Toggle } from '@shared/components/ui/toggle';
import { AlertCircle, Grid, List, Search, UploadCloud, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMediaBrowser } from '../../hooks/useMediaBrowser';
import { MediaAsset, MediaFolder } from '../../types/media';
import { AssetEditor } from '../Editor/AssetEditor';
import { LoadingGraphic } from '../UI/LoadingGraphic';
import { Uploader } from '../Upload/Uploader';
import { AssetDeleter } from './AssetDeleter';
import { GridListing, TableListing } from './Listing';
import { Breadcrumbs } from './Navigation/Breadcrumbs';
import { FolderEditor } from './Navigation/FolderEditor';

interface AssetBrowserProps {
    selectedContainer?: string | null;
    selectedPath?: string | null;
    selectedPathUuid?: string | null;
    restrictNavigation?: boolean;
    selectedAssets?: string[];
    maxFiles?: number;
    canEdit?: boolean;
    children?: React.ReactNode;
    onNavigated?: (container: string, path: string) => void;
    onSelectionsUpdated?: (selections: string[]) => void;
    onAssetDoubleClicked?: (asset: MediaAsset) => void;
    onMoveAssets?: () => void;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({
    selectedContainer = null,
    selectedPath = null,
    selectedPathUuid = null,
    restrictNavigation = false,
    selectedAssets = [],
    maxFiles = 10,
    canEdit = false,
    children,
    onNavigated,
    onSelectionsUpdated,
    onAssetDoubleClicked,
    onMoveAssets,
}) => {
    const {
        containers,
        container,
        path,
        assets,
        folders,
        folder,
        pagination,
        searchTerm,
        isSearching,
        selectedAssets: browserSelectedAssets,
        displayMode,
        uploads,
        loadingAssets,
        loadError,
        initialized,
        loading,
        isEmpty,
        showSidebar,
        draggingFile,
        // Actions
        loadAssets,
        navigate,
        selectFolder,
        selectContainer,
        selectAsset,
        deselectAsset,
        clearSelections,
        sortBy,
        goToPage,
        setDisplayMode,
        setSearchTerm,
        uploadFile,
        dropFile,
        setDraggingFile,
        setUploads,
        downloadAsset,
        // Refs
        uploaderRef,
        elementRef,
    } = useMediaBrowser(selectedContainer, selectedPath, undefined, restrictNavigation);

    const [showAssetDeleter, setShowAssetDeleter] = useState<boolean>(false);
    const [assetsToBeDeleted, setAssetsToBeDeleted] = useState<MediaAsset[]>([]);
    const [showAssetEditor, setShowAssetEditor] = useState<boolean>(false);
    const [editedAssetId, setEditedAssetId] = useState<string | null>(null);
    const [showFolderCreator, setShowFolderCreator] = useState<boolean>(false);
    const [showFolderEditor, setShowFolderEditor] = useState<boolean>(false);
    const [editedFolderPath, setEditedFolderPath] = useState<string | null>(null);

    // Effect to sync external selectedAssets with internal state
    useEffect(() => {
        if (onSelectionsUpdated) {
            onSelectionsUpdated(browserSelectedAssets);
        }
    }, [browserSelectedAssets, onSelectionsUpdated]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();

        if (canEdit) {
            setDraggingFile(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();

        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDraggingFile(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        dropFile(e);
    };

    const clearUpload = useCallback((uploadId: string) => {
        uploaderRef.current?.clear(uploadId);
    }, [uploaderRef]);

    const clearUploads = useCallback(() => {
        uploaderRef.current?.clearAll();
    }, [uploaderRef]);

    const handleUploadsUpdated = useCallback((updatedUploads: typeof uploads) => {
        setUploads(updatedUploads);
    }, [setUploads]);

    const handleAssetSelected = useCallback(
        (assetId: string) => {
            selectAsset(assetId);
        },
        [selectAsset],
    );

    const handleAssetDeselected = useCallback(
        (assetId: string) => {
            deselectAsset(assetId);
        },
        [deselectAsset],
    );

    const handleAssetEditing = useCallback(
        (assetId: string) => {
            if (canEdit) {
                setEditedAssetId(assetId);
                setShowAssetEditor(true);
            }
        },
        [canEdit],
    );

    const handleAssetDeleting = useCallback(
        (assetId: string) => {
            const assetToDelete = assets.find((asset) => asset.id === assetId);
            if (assetToDelete) {
                setAssetsToBeDeleted([assetToDelete]);
                setShowAssetDeleter(true);
            }
        },
        [assets],
    );

    const handleAssetDownloading = useCallback(
        async (assetId: string) => {
            try {
                await downloadAsset(assetId);
                toast.success('Download started');
            } catch (error) {
                console.error('Download error:', error);
                toast.error('Failed to download file');
            }
        },
        [downloadAsset],
    );

    const handleFolderSelected = useCallback(
        (folderData: MediaFolder) => {
            selectFolder(folderData);
            if (onNavigated && container) {
                onNavigated(container.id, folderData.path);
            }
        },
        [selectFolder, onNavigated, container],
    );

    const handleFolderEditing = useCallback((folderData: MediaFolder) => {
        setEditedFolderPath(folderData.path);
        setShowFolderEditor(true);
    }, []);

    const handleAssetDoubleClicked = useCallback(
        (asset: MediaAsset) => {
            // Call the external handler if provided
            if (onAssetDoubleClicked) {
                onAssetDoubleClicked(asset);
            }
        },
        [onAssetDoubleClicked],
    );

    const handleDeleteAssets = useCallback(() => {
        const assetsToDelete = assets.filter((asset) => browserSelectedAssets.includes(asset.id));
        if (assetsToDelete.length > 0) {
            setAssetsToBeDeleted(assetsToDelete);
            setShowAssetDeleter(true);
        }
    }, [assets, browserSelectedAssets]);

    const handleAssetsDeleted = useCallback(
        (deletedAssetIds: string[]) => {
            // Clear all selections since deleted assets were likely selected
            clearSelections();

            // Refresh the assets list
            loadAssets();

            // Show success message
            toast.success(`Successfully deleted ${deletedAssetIds.length} ${deletedAssetIds.length === 1 ? 'item' : 'items'}`);
        },
        [clearSelections, loadAssets],
    );

    const handleAssetDeleterClosed = useCallback(() => {
        setShowAssetDeleter(false);
        setAssetsToBeDeleted([]);
    }, []);

    const handleCreateFolder = () => {
        setShowFolderCreator(true);
    };

    const maxFilesReached = maxFiles && selectedAssets.length >= maxFiles;

    if (loadError) {
        return (
            <div role="alert" className="flex h-64 flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-muted-foreground">{loadError}</p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => loadAssets()}>
                        Try again
                    </Button>
                    {!restrictNavigation && container && path !== '/' && (
                        <Button type="button" onClick={() => navigate(container.id, '/')}>
                            Open media library
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (!initialized) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingGraphic />
            </div>
        );
    }

    return (
        <div
            ref={elementRef}
            className="asset-browser relative flex h-full overflow-hidden"
        >
            {showSidebar && (
                <div className="asset-browser-sidebar w-64 bg-gray-50 p-4 dark:bg-gray-800">
                    <h4 className="mb-4 font-semibold">Containers</h4>
                    {Object.values(containers).map((c) => (
                        <div
                            key={c.id}
                            className={`sidebar-item cursor-pointer rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${container?.id === c.id ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                        >
                            <button type="button" onClick={() => selectContainer(c.id)} className="w-full text-left">
                                {c.title}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="asset-browser-main flex min-h-0 flex-1 flex-col">
                <div className="asset-browser-header shrink-0 bg-gray-50 p-4 dark:bg-gray-800">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            {isSearching ? 'Search Results' : folder?.title || folder?.path || path}
                            {loadingAssets && <LoadingGraphic text="" />}
                        </h1>
                    </div>

                    <div className="asset-browser-actions flex flex-wrap items-center gap-4">
                        {!browserSelectedAssets.length && (
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <Input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search"
                                    className="w-64 pl-9"
                                />
                            </div>
                        )}

                        {browserSelectedAssets.length > 0 && (
                            <div className="flex gap-2">
                                <Button variant="destructive" onClick={handleDeleteAssets}>
                                    Delete
                                </Button>
                                <Button variant="outline" onClick={() => clearSelections()}>
                                    Uncheck All
                                </Button>
                                {onMoveAssets && (
                                    <Button variant="outline" onClick={onMoveAssets}>
                                        Move
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="flex gap-1">
                            <Toggle pressed={displayMode === 'grid'} onPressedChange={() => setDisplayMode('grid')} aria-label="Grid view">
                                <Grid className="h-4 w-4" />
                            </Toggle>
                            <Toggle pressed={displayMode === 'table'} onPressedChange={() => setDisplayMode('table')} aria-label="Table view">
                                <List className="h-4 w-4" />
                            </Toggle>
                        </div>

                        <div className="flex gap-2">
                            {!restrictNavigation && !isSearching && (
                                <Button variant="outline" onClick={handleCreateFolder}>
                                    New Folder
                                </Button>
                            )}
                            {!isSearching && (
                                <Button variant="outline" onClick={uploadFile}>
                                    Upload
                                </Button>
                            )}
                        </div>

                        {children}
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div
                    className="asset-browser-content flex-1 overflow-y-auto pb-20"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Upload Progress */}
                    {uploads.length > 0 && (
                        <div className="uploads-section border-b bg-card p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-semibold">
                                    {uploads.some(u => u.status === 'uploading') ? 'Uploading files...' : 'Upload Status'}
                                </h3>
                                {uploads.length > 1 && !uploads.some(u => u.status === 'uploading') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearUploads}
                                        className="h-auto px-2 py-1 text-xs"
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            {uploads.map((upload) => (
                                <div
                                    key={upload.id}
                                    className={`upload-item mb-2 rounded-lg border p-3 last:mb-0 ${
                                        upload.status === 'error' ? 'border-destructive/25 bg-destructive/5' : 'border-border bg-background'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        {upload.status === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
                                        <span className="flex-1 truncate font-medium">{upload.name}</span>
                                        {upload.status === 'error' ? (
                                            <span className="shrink-0 font-medium text-destructive">Could not upload</span>
                                        ) : upload.status === 'completed' ? (
                                            <span className="text-green-600 font-medium shrink-0">Completed</span>
                                        ) : (
                                            <span className="shrink-0">{upload.progress}%</span>
                                        )}
                                        {(upload.status === 'error' || upload.status === 'completed') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                type="button"
                                                onClick={() => clearUpload(upload.id)}
                                                aria-label={`Dismiss ${upload.name} upload status`}
                                                className="h-6 w-6 shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    {upload.status === 'error' ? (
                                        <div className="mt-1 text-sm text-destructive">{upload.error}</div>
                                    ) : upload.status === 'completed' ? (
                                        <div className="text-sm text-green-600 mt-1">Upload completed successfully</div>
                                    ) : (
                                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${upload.progress}%` }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Asset Listing */}
                    {displayMode === 'grid' ? (
                        <GridListing
                            container={container?.id || ''}
                            assets={assets}
                            folder={folder}
                            subfolders={folders}
                            loading={loading}
                            selectedAssets={browserSelectedAssets}
                            restrictNavigation={restrictNavigation}
                            isSearching={isSearching}
                            canEdit={canEdit}
                            onFolderSelected={handleFolderSelected}
                            onFolderEditing={handleFolderEditing}
                            onAssetSelected={handleAssetSelected}
                            onAssetDeselected={handleAssetDeselected}
                            onAssetEditing={handleAssetEditing}
                            onAssetDeleting={handleAssetDeleting}
                            onAssetDownloading={handleAssetDownloading}
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                            onSorted={sortBy}
                            onFolderDeleted={loadAssets}
                        />
                    ) : (
                        <TableListing
                            container={container?.id || ''}
                            assets={assets}
                            folder={folder}
                            subfolders={folders}
                            loading={loading}
                            selectedAssets={browserSelectedAssets}
                            restrictNavigation={restrictNavigation}
                            isSearching={isSearching}
                            canEdit={canEdit}
                            onFolderSelected={handleFolderSelected}
                            onFolderEditing={handleFolderEditing}
                            onAssetSelected={handleAssetSelected}
                            onAssetDeselected={handleAssetDeselected}
                            onAssetEditing={handleAssetEditing}
                            onAssetDeleting={handleAssetDeleting}
                            onAssetDownloading={handleAssetDownloading}
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                            onSorted={sortBy}
                            onFolderDeleted={loadAssets}
                        />
                    )}

                    {isSearching && isEmpty && (
                        <div className="no-results py-12 text-center">
                            <h2 className="text-lg font-semibold text-gray-500">No Search Results</h2>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && <div className="pagination-section p-4">{/* You'll need to implement pagination component */}</div>}
                </div>

                {/* Fixed Breadcrumbs Footer */}
                {!restrictNavigation && !isSearching && (
                    <div className="absolute right-0 bottom-0 left-0 z-10 border-t bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <Breadcrumbs path={path} folder={folder} folders={folders} onNavigated={handleFolderSelected} />
                    </div>
                )}
            </div>

            {canEdit && draggingFile && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dotted border-primary/80 bg-card/95 p-6 text-center backdrop-blur-[1px]">
                    <div className="rounded-full bg-background p-3 shadow-sm">
                        <UploadCloud className="h-7 w-7 text-primary" />
                    </div>
                    <div className="ml-3 text-left">
                        <p className="font-semibold text-foreground">Drop files to upload</p>
                        <p className="text-muted-foreground text-sm">Release to add them to this folder.</p>
                    </div>
                </div>
            )}

            {/* Asset Deleter */}
            {showAssetDeleter && (
                <AssetDeleter
                    assets={assetsToBeDeleted}
                    isOpen={showAssetDeleter}
                    onDeleted={handleAssetsDeleted}
                    onClosed={handleAssetDeleterClosed}
                />
            )}

            {/* Folder Creator Modal */}
            {showFolderCreator && (
                <FolderEditor
                    container={container!}
                    path={path}
                    parentUuid={folder?.uuid}
                    create={true}
                    onCreated={(newFolder) => {
                        setShowFolderCreator(false);
                        loadAssets(); // Reload to show the new folder
                    }}
                    onClosed={() => setShowFolderCreator(false)}
                />
            )}

            {/* Folder Editor Modal */}
            {showFolderEditor && editedFolderPath && (
                <FolderEditor
                    container={container!}
                    path={folders.find((f) => f.path === editedFolderPath) || editedFolderPath}
                    parentUuid={folder?.uuid}
                    create={false}
                    onUpdated={(updatedFolder) => {
                        setShowFolderEditor(false);
                        setEditedFolderPath(null);
                        loadAssets(); // Reload to show the updated folder
                    }}
                    onClosed={() => {
                        setShowFolderEditor(false);
                        setEditedFolderPath(null);
                    }}
                />
            )}

            {/* Hidden File Uploader */}
            <Uploader
                ref={uploaderRef}
                container={container?.id}
                path={path}
                onUploadComplete={(item, uploads) => {
                    loadAssets(); // Reload assets after upload
                    // Don't clear uploads here - let them clear naturally after showing success state
                }}
                onUpdated={handleUploadsUpdated}
                onError={(error) => {
                    // Show error toast
                    toast.error(error);
                }}
            />

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
                    loadAssets(); // Reload assets to show updated data
                }}
                onDeleted={(assetId) => {
                    setShowAssetEditor(false);
                    setEditedAssetId(null);
                    loadAssets(); // Reload assets after deletion
                }}
                allowDeleting={canEdit}
            />
        </div>
    );
};
