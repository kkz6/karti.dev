import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Skeleton } from '@shared/components/ui/skeleton';
import { LoadingGraphic } from '../LoadingGraphic';
import { Toggle } from '@shared/components/ui/toggle';
import { GridListing, TableListing } from './Listing';
import { Breadcrumbs } from './Breadcrumbs';
import { useMediaBrowser, createDefaultServices } from '../../hooks/useMediaBrowser';
import { MediaAsset, MediaFolder, MediaContainer, DisplayMode } from '../../types/media';

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
  onAssetDoubleClicked
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

  const handleAssetSelected = useCallback((assetId: string) => {
    selectAsset(assetId);
  }, [selectAsset]);

  const handleAssetDeselected = useCallback((assetId: string) => {
    deselectAsset(assetId);
  }, [deselectAsset]);

  const handleAssetEditing = useCallback((assetId: string) => {
    if (canEdit) {
      setEditedAssetId(assetId);
      setShowAssetEditor(true);
    }
  }, [canEdit]);

  const handleAssetDeleting = useCallback((assetId: string) => {
    setDeleteModal(true);
    setAssetToBeDeleted([assetId]);
  }, []);

  const handleFolderSelected = useCallback((folderData: MediaFolder) => {
    selectFolder(folderData);
    if (onNavigated && container) {
      onNavigated(container.id, folderData.path);
    }
  }, [selectFolder, onNavigated, container]);

  const handleFolderEditing = useCallback((folderData: MediaFolder) => {
    setEditedFolderPath(folderData.path);
    setShowFolderEditor(true);
  }, []);

  const handleAssetDoubleClicked = useCallback((asset: MediaAsset) => {
    if (onAssetDoubleClicked) {
      onAssetDoubleClicked(asset);
    }
  }, [onAssetDoubleClicked]);

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
      <div className="flex items-center justify-center h-64">
        <LoadingGraphic />
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className="asset-browser"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {canEdit && draggingFile && (
        <div className="drag-notification fixed inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold">Drop to Upload</h3>
          </div>
        </div>
      )}

      {showSidebar && (
        <div className="asset-browser-sidebar w-64 bg-gray-50 p-4">
          <h4 className="font-semibold mb-4">Containers</h4>
          {Object.values(containers).map((c) => (
            <div
              key={c.id}
              className={`sidebar-item p-2 rounded cursor-pointer hover:bg-gray-100 ${
                container?.id === c.id ? 'bg-gray-200' : ''
              }`}
            >
              <button onClick={() => selectContainer(c.id)} className="w-full text-left">
                {c.title}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="asset-browser-main flex-1">
        <div className="asset-browser-header bg-gray-50 rounded-t-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              {isSearching ? (
                'Search Results'
              ) : restrictNavigation ? (
                folder?.title || folder?.path
              ) : (
                container?.title
              )}
              {loadingAssets && <LoadingGraphic text="" />}
            </h1>
          </div>

          <div className="asset-browser-actions flex flex-wrap gap-4 items-center">
            {!browserSelectedAssets.length && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="pl-9 w-64"
                />
              </div>
            )}

            {browserSelectedAssets.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setDeleteModalMulti(true)}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => clearSelections()}
                >
                  Uncheck All
                </Button>
              </div>
            )}

            <div className="flex gap-1">
              <Toggle
                pressed={displayMode === 'grid'}
                onPressedChange={() => setDisplayMode('grid')}
                aria-label="Grid view"
              >
                <span className="icon icon-grid" />
              </Toggle>
              <Toggle
                pressed={displayMode === 'table'}
                onPressedChange={() => setDisplayMode('table')}
                aria-label="Table view"
              >
                <span className="icon icon-list" />
              </Toggle>
            </div>

            <div className="flex gap-2">
              {!restrictNavigation && !isSearching && (
                <Button
                  variant="outline"
                  onClick={handleCreateFolder}
                >
                  New Folder
                </Button>
              )}
              {!isSearching && (
                <Button
                  variant="outline"
                  onClick={uploadFile}
                >
                  Upload
                </Button>
              )}
            </div>

            {children}
          </div>
        </div>

        <div className="asset-browser-content">
          {/* Upload Progress */}
          {uploads.length > 0 && (
            <div className="uploads-section p-4 bg-blue-50">
              <h3 className="font-semibold mb-2">Uploading files...</h3>
              {uploads.map((upload) => (
                <div key={upload.id} className="upload-item mb-2">
                  <div className="flex justify-between text-sm">
                    <span>{upload.name}</span>
                    <span>{upload.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
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
            <div className="no-results text-center py-12">
              <h2 className="text-lg font-semibold text-gray-500">No Search Results</h2>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="pagination-section p-4">
            {/* You'll need to implement pagination component */}
          </div>
        )}

        {/* Breadcrumbs */}
        {!restrictNavigation && !isSearching && (
          <Breadcrumbs
            path={path}
            folder={folder}
            folders={folders}
            onNavigated={handleFolderSelected}
          />
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
            <Button
              variant="outline"
              onClick={() => setDeleteModalMulti(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteAssets(browserSelectedAssets)}
            >
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
            <Button
              variant="outline"
              onClick={() => setDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteAssets(assetToBeDeleted)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
