import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Input } from '@shared/components/ui/input';
import axios from 'axios';
import {
    FolderInput,
    FolderOpen,
    FolderPlus,
    Grid,
    List,
    ListX,
    MoreHorizontal,
    Search,
    Square,
    SquareCheck,
    SquareMinus,
    UploadCloud,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import '../../../css/media-workspace.css';
import { useMediaBrowser } from '../../hooks/useMediaBrowser';
import { MediaAsset, MediaFolder } from '../../types/media';
import { toggleVisibleAssets, visibleSelectionState } from '../../utils/asset-selection';
import { AssetEditor } from '../Editor/AssetEditor';
import { LoadingGraphic } from '../UI/LoadingGraphic';
import { Uploader } from '../Upload/Uploader';
import { Uploads } from '../Upload/Uploads';
import { AssetDeleter } from './AssetDeleter';
import { AssetMover } from './AssetMover';
import { GridListing, TableListing } from './Listing';
import { MEDIA_DRAG_TYPE, MediaMoveContext, normalizeFolder } from './MediaMoveContext';
import { Breadcrumbs } from './Navigation/Breadcrumbs';
import { FolderEditor } from './Navigation/FolderEditor';

interface AssetBrowserProps {
    indexPage?: boolean;
    selectedContainer?: string | null;
    selectedPath?: string | null;
    selectedPathUuid?: string | null;
    restrictNavigation?: boolean;
    selectedAssets?: string[];
    maxFiles?: number;
    canEdit?: boolean;
    children?: React.ReactNode;
    onNavigated?: (container: string, path: string, selections?: string[]) => void;
    onSelectionsUpdated?: (selections: string[]) => void;
    onAssetDoubleClicked?: (asset: MediaAsset) => void;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({
    indexPage = false,
    selectedContainer = null,
    selectedPath = null,
    selectedAssets: controlledSelections,
    maxFiles,
    restrictNavigation = false,
    canEdit = false,
    children,
    onNavigated,
    onSelectionsUpdated,
    onAssetDoubleClicked,
}) => {
    const {
        containers,
        container,
        path,
        assets,
        folders,
        folder,
        pagination,
        sort,
        sortOrder,
        searchTerm,
        isSearching,
        selectedAssets: internalSelections,
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
        refreshAfterUpload,
        navigate,
        selectFolder,
        selectContainer,
        selectAsset,
        deselectAsset,
        clearSelections: clearInternalSelections,
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
    const [moveIds, setMoveIds] = useState<string[] | null>(null);
    const [moving, setMoving] = useState(false);
    const movingRef = useRef(false);
    const draggedIds = useRef<string[]>([]);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    const browserSelectedAssets = controlledSelections ?? internalSelections;
    const canSelectMultiple = indexPage || maxFiles !== 1;
    const visibleIds = assets.map((asset) => asset.id);
    const allSelected = visibleSelectionState(browserSelectedAssets, visibleIds);
    const SelectionIcon = allSelected === true ? SquareCheck : allSelected === 'mixed' ? SquareMinus : Square;
    const toggleSelectAll = () => {
        if (!canSelectMultiple || loadingAssets || moving || !visibleIds.length) return;
        const next = toggleVisibleAssets(browserSelectedAssets, visibleIds, indexPage ? 0 : maxFiles);
        if (allSelected !== true && visibleSelectionState(next, visibleIds) !== true) {
            toast.info(`Choose up to ${maxFiles} files. Your existing selections have been kept.`);
        }
        if (controlledSelections !== undefined) onSelectionsUpdated?.(next);
        else {
            clearInternalSelections();
            next.forEach(selectAsset);
        }
    };
    const clearSelections = useCallback(() => {
        if (controlledSelections !== undefined) onSelectionsUpdated?.([]);
        else clearInternalSelections();
    }, [controlledSelections, onSelectionsUpdated, clearInternalSelections]);

    const moveFiles = async (ids: string[], destination: string) => {
        if (movingRef.current || !canEdit || !indexPage || !ids.length || !container) return;
        movingRef.current = true;
        setMoving(true);
        let completed: string[] = [];
        let succeeded = false;
        try {
            const { data } = await axios.post(route('media.move'), { media_ids: ids, destination, disk: container.id });
            completed = data.moved_ids;
            succeeded = true;
            // Follow the files so their checked state remains visible, rather than
            // keeping an invisible selection in the folder they just left.
            setSearchTerm('');
            navigate(container.id, destination);
            if (controlledSelections !== undefined) onSelectionsUpdated?.(completed);
            else completed.forEach(selectAsset);
            onNavigated?.(container.id, destination, completed);
            toast.success(
                `${completed.length} ${completed.length === 1 ? 'file moved' : 'files moved'} to ${destination === '/' ? 'All files' : destination}`,
            );
        } catch (error) {
            if (axios.isAxiosError(error)) completed = error.response?.data?.moved_ids || [];
            throw error;
        } finally {
            if (completed.length && !succeeded) {
                const remaining = browserSelectedAssets.filter((id) => !completed.includes(id));
                if (controlledSelections !== undefined) onSelectionsUpdated?.(remaining);
                else completed.forEach(deselectAsset);
                setMoveIds((current) => current?.filter((id) => !completed.includes(id)) ?? null);
            }
            try {
                if (!succeeded) await loadAssets();
            } finally {
                movingRef.current = false;
                setMoving(false);
            }
        }
    };

    const moveContext: React.ContextType<typeof MediaMoveContext> =
        indexPage && canEdit
            ? {
                  moving,
                  open: (ids) => setMoveIds(ids),
                  start: (event, id) => {
                      if (movingRef.current) {
                          event.preventDefault();
                          return;
                      }
                      const ids = browserSelectedAssets.includes(id) ? [...browserSelectedAssets] : [id];
                      draggedIds.current = ids;
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData(MEDIA_DRAG_TYPE, JSON.stringify(ids));
                  },
                  end: () => {
                      draggedIds.current = [];
                      setDropTarget(null);
                  },
                  folderProps: (destination) => ({
                      'data-drop-target': dropTarget === normalizeFolder(destination),
                      onDragOver: (event) => {
                          if (!draggedIds.current.length || movingRef.current || normalizeFolder(destination) === normalizeFolder(path)) return;
                          event.preventDefault();
                          event.stopPropagation();
                          event.dataTransfer.dropEffect = 'move';
                          setDropTarget(normalizeFolder(destination));
                      },
                      onDragLeave: (event) => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null);
                      },
                      onDrop: (event) => {
                          if (!draggedIds.current.length || !event.dataTransfer.types.includes(MEDIA_DRAG_TYPE)) return;
                          event.preventDefault();
                          event.stopPropagation();
                          const ids = draggedIds.current;
                          draggedIds.current = [];
                          setDropTarget(null);
                          if (normalizeFolder(destination) === normalizeFolder(path)) return;
                          void moveFiles(ids, destination).catch((error) =>
                              toast.error(
                                  axios.isAxiosError(error) ? error.response?.data?.message || 'Could not move files.' : 'Could not move files.',
                              ),
                          );
                      },
                  }),
              }
            : null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();

        if (canEdit && e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy';
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
        if (canEdit && e.dataTransfer.types.includes('Files')) dropFile(e);
        else e.preventDefault();
    };

    const clearUpload = useCallback(
        (uploadId: string) => {
            uploaderRef.current?.clear(uploadId);
        },
        [uploaderRef],
    );

    const clearUploads = useCallback(() => {
        uploaderRef.current?.clearAll();
    }, [uploaderRef]);

    const handleUploadsUpdated = useCallback(
        (updatedUploads: typeof uploads) => {
            setUploads(updatedUploads);
        },
        [setUploads],
    );

    const handleAssetSelected = (assetId: string) => {
        if (browserSelectedAssets.includes(assetId)) return;
        if (maxFiles && maxFiles > 1 && browserSelectedAssets.length >= maxFiles) {
            toast.error(`Choose up to ${maxFiles} files.`);
            return;
        }
        if (controlledSelections !== undefined) {
            onSelectionsUpdated?.(maxFiles === 1 ? [assetId] : [...browserSelectedAssets, assetId]);
        } else {
            if (maxFiles === 1) clearInternalSelections();
            selectAsset(assetId);
        }
    };

    const handleAssetDeselected = (assetId: string) => {
        if (controlledSelections !== undefined) onSelectionsUpdated?.(browserSelectedAssets.filter((id) => id !== assetId));
        else deselectAsset(assetId);
    };

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
            // Keep protected/failed files selected after a mixed bulk deletion.
            if (controlledSelections !== undefined) {
                onSelectionsUpdated?.(browserSelectedAssets.filter((id) => !deletedAssetIds.includes(id)));
            } else {
                deletedAssetIds.forEach(deselectAsset);
            }

            // Refresh the assets list
            loadAssets();

            // Show success message
            toast.success(`Successfully deleted ${deletedAssetIds.length} ${deletedAssetIds.length === 1 ? 'item' : 'items'}`);
        },
        [controlledSelections, onSelectionsUpdated, browserSelectedAssets, deselectAsset, loadAssets],
    );

    const handleAssetDeleterClosed = useCallback(() => {
        setShowAssetDeleter(false);
        setAssetsToBeDeleted([]);
    }, []);

    const handleCreateFolder = () => {
        setShowFolderCreator(true);
    };

    const libraryActions = (
        <>
            <div className="media-view-toggle isolate inline-flex shrink-0" role="group" aria-label="Asset view">
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Grid view"
                    aria-pressed={displayMode === 'grid'}
                    onClick={() => setDisplayMode('grid')}
                >
                    <Grid />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Table view"
                    aria-pressed={displayMode === 'table'}
                    onClick={() => setDisplayMode('table')}
                >
                    <List />
                </Button>
            </div>
            {canEdit && !restrictNavigation && !isSearching && (
                <Button type="button" variant="outline" onClick={handleCreateFolder}>
                    <FolderPlus aria-hidden="true" />
                    New folder
                </Button>
            )}
        </>
    );

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
        <MediaMoveContext.Provider value={moveContext}>
            <div
                ref={elementRef}
                className={`asset-browser media-workspace relative flex h-full min-h-0 overflow-hidden ${indexPage ? '' : 'media-picker'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {showSidebar && (
                    <div className="asset-browser-sidebar bg-muted/30 w-64 p-4">
                        <h4 className="mb-4 font-semibold">Containers</h4>
                        {Object.values(containers).map((c) => (
                            <div
                                key={c.id}
                                className={`sidebar-item hover:bg-accent cursor-pointer rounded p-2 ${container?.id === c.id ? 'bg-accent text-accent-foreground' : ''}`}
                            >
                                <button type="button" onClick={() => selectContainer(c.id)} className="w-full text-left">
                                    {c.title}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="asset-browser-main flex min-h-0 min-w-0 flex-1 flex-col">
                    {indexPage && (
                        <div className="mb-8 shrink-0">
                            <IndexHeader
                                title="Media Manager"
                                icon={FolderOpen}
                                actions={
                                    canEdit && (
                                        <Button type="button" onClick={uploadFile}>
                                            <UploadCloud aria-hidden="true" />
                                            Upload files
                                        </Button>
                                    )
                                }
                            />
                        </div>
                    )}
                    <div
                        className={
                            indexPage
                                ? 'asset-browser-header mb-4 shrink-0'
                                : 'asset-browser-header border-border bg-card shrink-0 border-b px-5 py-4'
                        }
                    >
                        <div className="asset-browser-actions flex flex-wrap items-center gap-3">
                            <div className="relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search files…"
                                    aria-label="Search media"
                                    className="w-full pl-9"
                                />
                            </div>
                            {canSelectMultiple && displayMode === 'grid' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    role="checkbox"
                                    aria-checked={allSelected}
                                    aria-label={allSelected === true ? 'Deselect all files on this page' : 'Select all files on this page'}
                                    title="Applies to files shown on this page"
                                    disabled={loadingAssets || moving || visibleIds.length === 0}
                                    onClick={toggleSelectAll}
                                >
                                    <SelectionIcon aria-hidden="true" />
                                    {allSelected === true ? 'Deselect all' : 'Select all'}
                                </Button>
                            )}
                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                {libraryActions}
                                {!indexPage && canEdit && (
                                    <Button onClick={uploadFile}>
                                        <UploadCloud aria-hidden="true" />
                                        Upload files
                                    </Button>
                                )}
                            </div>
                            {children}
                        </div>
                        {!indexPage && !restrictNavigation && (
                            <div className="mt-3">
                                <Breadcrumbs path={path} folder={folder} folders={folders} onNavigated={handleFolderSelected} />
                            </div>
                        )}
                        {indexPage && browserSelectedAssets.length > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground tabular-nums" role="status">
                                    {browserSelectedAssets.length} selected
                                </span>
                                <Button variant="ghost" onClick={clearSelections}>
                                    <ListX aria-hidden="true" />
                                    Clear
                                </Button>
                                {canEdit && (
                                    <Button variant="outline" disabled={moving} onClick={() => setMoveIds([...browserSelectedAssets])}>
                                        <FolderInput />
                                        Move to folder
                                    </Button>
                                )}
                                {canEdit && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" aria-label="Selection actions">
                                                <MoreHorizontal />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem className="text-destructive" onSelect={handleDeleteAssets}>
                                                Delete selected files
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={indexPage ? 'media-library-panel flex min-h-0 flex-1 flex-col' : 'contents'}>
                        {indexPage && !restrictNavigation && (
                            <div className="media-location mb-3 shrink-0">
                                <Breadcrumbs path={path} folder={folder} folders={folders} onNavigated={handleFolderSelected} />
                            </div>
                        )}
                        {/* Scrollable Content Area */}
                        <div
                            className={`asset-browser-content relative min-h-0 overflow-auto ${indexPage ? 'bg-card rounded-lg border' : 'flex-1'}`}
                            aria-busy={loadingAssets}
                        >
                            <Uploads uploads={uploads} onClearUpload={clearUpload} onClearAll={clearUploads} />

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
                                    currentSort={sort}
                                    sortOrder={sortOrder}
                                    onToggleSelectAll={canSelectMultiple ? toggleSelectAll : undefined}
                                    selectAllState={allSelected}
                                    selectAllDisabled={loadingAssets || moving || visibleIds.length === 0}
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

                            {!loading && isEmpty && (
                                <div className="no-results flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center">
                                    <FolderOpen className="text-muted-foreground mb-2 size-8" aria-hidden="true" />
                                    <h2 className="font-medium">{isSearching ? 'No matching files' : 'This folder is empty'}</h2>
                                    <p className="text-muted-foreground text-sm">
                                        {isSearching
                                            ? 'Try another search or clear it to browse this folder.'
                                            : 'Upload files or drag them into this area to get started.'}
                                    </p>
                                    {isSearching && (
                                        <Button variant="outline" onClick={() => setSearchTerm('')}>
                                            Clear search
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {
                            <div
                                className={`media-library-footer text-muted-foreground flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs ${indexPage ? 'mt-4' : 'border-t px-5 py-2'}`}
                            >
                                <span role="status">
                                    {loadingAssets
                                        ? 'Loading files…'
                                        : `${folders.length} ${folders.length === 1 ? 'folder' : 'folders'} · ${assets.length} ${assets.length === 1 ? 'file' : 'files'} shown`}
                                </span>
                                {pagination && pagination.meta.last_page > 1 ? (
                                    <div className="flex items-center gap-2">
                                        <span>
                                            Page {pagination.meta.current_page} of {pagination.meta.last_page}
                                        </span>
                                        <Button
                                            variant="outline"
                                            disabled={loadingAssets || pagination.meta.current_page <= 1}
                                            onClick={() => goToPage(pagination.meta.current_page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={loadingAssets || pagination.meta.current_page >= pagination.meta.last_page}
                                            onClick={() => goToPage(pagination.meta.current_page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                ) : (
                                    canEdit && (
                                        <span className="hidden sm:inline">
                                            {indexPage ? 'Drag library files onto a folder to move them' : 'Drag files here to upload'}
                                        </span>
                                    )
                                )}
                            </div>
                        }
                    </div>
                </div>

                {canEdit && draggingFile && (
                    <div className="border-primary/80 bg-card/95 pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dotted p-6 text-center backdrop-blur-[1px]">
                        <div className="bg-background rounded-full p-3 shadow-sm">
                            <UploadCloud className="text-primary h-7 w-7" />
                        </div>
                        <div className="ml-3 text-left">
                            <p className="text-foreground font-semibold">Drop files to upload</p>
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
                        onCreated={() => {
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
                        onUpdated={() => {
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

                {moving && (
                    <p role="status" className="bg-background absolute right-4 bottom-4 rounded-md border px-4 py-2 text-sm shadow-sm">
                        Moving files…
                    </p>
                )}
                {moveIds && container && (
                    <AssetMover
                        assets={moveIds}
                        container={container.id}
                        folder={path}
                        onMove={(destination) => moveFiles(moveIds, destination)}
                        onClosed={() => setMoveIds(null)}
                    />
                )}

                {/* Hidden File Uploader */}
                <Uploader
                    ref={uploaderRef}
                    container={container?.id}
                    path={path}
                    onUploadComplete={refreshAfterUpload}
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
                    onSaved={() => {
                        setShowAssetEditor(false);
                        setEditedAssetId(null);
                        loadAssets(); // Reload assets to show updated data
                    }}
                    onDeleted={() => {
                        setShowAssetEditor(false);
                        setEditedAssetId(null);
                        loadAssets(); // Reload assets after deletion
                    }}
                    allowDeleting={canEdit}
                />
            </div>
        </MediaMoveContext.Provider>
    );
};
