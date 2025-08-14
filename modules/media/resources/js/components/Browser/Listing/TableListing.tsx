import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog';
import { MediaAsset, MediaFolder } from '../../../types/media';
import { AssetRow } from './AssetRow';
import { FolderRow } from './FolderRow';
import { FileIcon } from '../../FileIcon';

interface TableListingProps {
  container: string;
  assets: MediaAsset[];
  folder: MediaFolder | null;
  subfolders: MediaFolder[];
  loading: boolean;
  selectedAssets: string[];
  restrictNavigation: boolean;
  isSearching: boolean;
  canEdit: boolean;
  onFolderSelected: (folder: MediaFolder) => void;
  onFolderEditing: (folder: MediaFolder) => void;
  onAssetSelected: (assetId: string) => void;
  onAssetDeselected: (assetId: string) => void;
  onAssetEditing: (assetId: string) => void;
  onAssetDeleting: (assetId: string) => void;
  onAssetDoubleClicked: (asset: MediaAsset) => void;
  onSorted: (field: string) => void;
}

interface Column {
  field: string;
  label: string;
  extra?: boolean;
}

export const TableListing: React.FC<TableListingProps> = ({
  container,
  assets,
  folder,
  subfolders,
  loading,
  selectedAssets,
  restrictNavigation,
  isSearching,
  canEdit,
  onFolderSelected,
  onFolderEditing,
  onAssetSelected,
  onAssetDeselected,
  onAssetEditing,
  onAssetDeleting,
  onAssetDoubleClicked,
  onSorted
}) => {
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteFolderSelected, setDeleteFolderSelected] = useState<MediaFolder | null>(null);
  const [currentSort, setCurrentSort] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const columns: Column[] = [
    {
      field: "title",
      label: "Title",
    },
    {
      field: "size",
      label: "File Size",
      extra: true,
    },
    {
      field: "lastModified",
      label: "Date Modified",
      extra: true,
    },
  ];

  const hasParent = folder?.parent_path !== null;
  const hasResults = assets.length > 0 || subfolders.length > 0;

  const handleSort = (field: string) => {
    if (isSearching) return;
    
    let newOrder: 'asc' | 'desc' = 'asc';
    if (currentSort === field) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    setCurrentSort(field);
    setSortOrder(newOrder);
    onSorted(field);
  };

  const isColumnActive = (column: Column) => {
    if (isSearching) return false;
    return column.field === currentSort;
  };

  const handleParentSelect = () => {
    if (folder?.parent) {
      onFolderSelected(folder.parent);
    }
  };

  const handleDeleteFolder = (folderToDelete: MediaFolder) => {
    setDeleteFolderSelected(folderToDelete);
    setDeleteModal(true);
  };

  const confirmDeleteFolder = async () => {
    if (deleteFolderSelected) {
      try {
        // Implement folder deletion logic here
        console.log('Deleting folder:', deleteFolderSelected);
        setDeleteModal(false);
        setDeleteFolderSelected(null);
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const cancelDeleteFolder = () => {
    setDeleteModal(false);
    setDeleteFolderSelected(null);
  };

  if (!(!isSearching || (isSearching && hasResults))) {
    return null;
  }

  return (
    <>
      <div className="asset-table-listing w-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-12"></th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`text-left p-3 font-medium text-gray-900 ${
                      column.extra ? 'hidden md:table-cell' : ''
                    } ${
                      isColumnActive(column) ? 'bg-gray-50' : ''
                    } ${
                      !isSearching ? 'cursor-pointer hover:bg-gray-50' : ''
                    }`}
                    onClick={() => handleSort(column.field)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {isColumnActive(column) && (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {hasParent && !restrictNavigation && (
                <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="p-3" onClick={handleParentSelect}>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <FileIcon extension="folder" className="w-6 h-6" />
                    </div>
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={handleParentSelect}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ..
                    </button>
                  </td>
                  <td className="p-3 hidden md:table-cell">..</td>
                  <td className="p-3 hidden md:table-cell">..</td>
                  <td className="p-3"></td>
                </tr>
              )}

              {subfolders.map((folderItem, index) => (
                <FolderRow
                  key={index}
                  folder={folderItem}
                  canEdit={canEdit}
                  onSelected={onFolderSelected}
                  onEditing={onFolderEditing}
                  onDeleting={handleDeleteFolder}
                />
              ))}

              {assets.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  selectedAssets={selectedAssets}
                  canEdit={canEdit}
                  onSelected={onAssetSelected}
                  onDeselected={onAssetDeselected}
                  onEditing={onAssetEditing}
                  onDeleting={onAssetDeleting}
                  onDoubleClicked={onAssetDoubleClicked}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Folder Modal */}
      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete the folder selected?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>On clicking confirm the selected item will be deleted. If you don't wish to do it then please press cancel.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDeleteFolder}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteFolder}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
