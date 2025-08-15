import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Toggle } from '@shared/components/ui/toggle';
import { Grid, List, Search } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useMediaBrowser } from '../../hooks/useMediaBrowser';
import { MediaAsset, MediaFolder } from '../../types/media';
import { AssetEditor } from '../AssetEditor';
import { LoadingGraphic } from '../LoadingGraphic';
import { Uploader } from '../Uploader';
import { Breadcrumbs } from './Breadcrumbs';
import { FolderEditor } from './FolderEditor';
import { GridListing, TableListing } from './Listing';

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
        // Refs
        uploaderRef,
        elementRef,
    } = useMediaBrowser(selectedContainer, selectedPath);

    const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [assetToBeDeleted, setAssetToBeDeleted] = useState<string[]>([]);
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
        setDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        dropFile(e);
    };

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

    const handleAssetDeleting = useCallback((assetId: string) => {
        setDeleteModal(true);
        setAssetToBeDeleted([assetId]);
    }, []);

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
            if (onAssetDoubleClicked) {
                onAssetDoubleClicked(asset);
            }
        },
        [onAssetDoubleClicked],
    );

    const handleDeleteAssets = async (ids: string[]) => {
        // Implement delete logic here
        setDeleteModal(false);
        setDeleteModalMulti(false);
        setAssetToBeDeleted([]);
    };

    const handleCreateFolder = () => {
        setShowFolderCreator(true);
    };

    const maxFilesReached = maxFiles && selectedAssets.length >= maxFiles;

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
            className="asset-browser relative flex h-full"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {canEdit && draggingFile && (
                <div className="drag-notification bg-opacity-90 fixed inset-0 z-50 flex items-center justify-center bg-blue-50">
                    <div className="text-center">
                        <div className="mb-4 text-4xl">📁</div>
                        <h3 className="text-lg font-semibold">Drop to Upload</h3>
                    </div>
                </div>
            )}

            {showSidebar && (
                <div className="asset-browser-sidebar w-64 bg-gray-50 p-4">
                    <h4 className="mb-4 font-semibold">Containers</h4>
                    {Object.values(containers).map((c) => (
                        <div
                            key={c.id}
                            className={`sidebar-item cursor-pointer rounded p-2 hover:bg-gray-100 ${container?.id === c.id ? 'bg-gray-200' : ''}`}
                        >
                            <button onClick={() => selectContainer(c.id)} className="w-full text-left">
                                {c.title}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="asset-browser-main flex min-h-0 flex-1 flex-col">
                <div className="asset-browser-header shrink-0 rounded-t-lg bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            {isSearching ? 'Search Results' : restrictNavigation ? folder?.title || folder?.path : container?.title}
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
                                <Button variant="destructive" onClick={() => setDeleteModalMulti(true)}>
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
                <div className="asset-browser-content flex-1 overflow-y-auto pb-12">
                    {/* Upload Progress */}
                    {uploads.length > 0 && (
                        <div className="uploads-section bg-blue-50 p-4">
                            <h3 className="mb-2 font-semibold">Uploading files...</h3>
                            {uploads.map((upload) => (
                                <div key={upload.id} className="upload-item mb-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{upload.name}</span>
                                        <span>{upload.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${upload.progress}%` }} />
                                    </div>
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
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                            onSorted={sortBy}
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
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                            onSorted={sortBy}
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
                    <div className="absolute right-0 bottom-0 left-0 z-10 border-t bg-white shadow-sm">
                        <Breadcrumbs path={path} folder={folder} folders={folders} onNavigated={handleFolderSelected} />
                    </div>
                )}
            </div>

            {/* Delete Modals */}
            <Dialog open={deleteModalMulti} onOpenChange={setDeleteModalMulti}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete {browserSelectedAssets.length} {browserSelectedAssets.length === 1 ? 'item' : 'items'}?
                        </DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalMulti(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteAssets(browserSelectedAssets)}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete item?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteAssets(assetToBeDeleted)}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                    setUploads([]); // Clear uploads
                }}
                onUpdated={(uploads) => {
                    setUploads(uploads);
                }}
                onError={(error) => {
                    console.error('Upload error:', error);
                    // Show error toast
                    const event = new CustomEvent('toast', {
                        detail: { type: 'error', message: error },
                    });
                    window.dispatchEvent(event);
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
