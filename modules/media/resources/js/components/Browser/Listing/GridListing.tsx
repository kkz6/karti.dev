import React from 'react';
import { MediaAsset, MediaFolder } from '../../../types/media';
import { AssetTile } from './AssetTile';
import { FolderTile } from './FolderTile';
import { FileIcon } from '../../FileIcon';

interface GridListingProps {
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

export const GridListing: React.FC<GridListingProps> = ({
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
  const hasParent = folder?.parent_path !== null;
  const hasResults = assets.length > 0 || subfolders.length > 0;

  if (!((hasParent && !restrictNavigation) || !isSearching || (isSearching && hasResults))) {
    return null;
  }

  const handleParentSelect = () => {
    if (folder?.parent) {
      onFolderSelected(folder.parent);
    }
  };

  return (
    <div className="asset-grid-listing grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {hasParent && !restrictNavigation && (
        <div
          className="asset-tile is-folder cursor-pointer group"
          onClick={handleParentSelect}
        >
          <div className="asset-thumb-container bg-gray-100 rounded-lg p-6 mb-2 group-hover:bg-gray-200 transition-colors">
            <FileIcon extension="folder" className="w-12 h-12 mx-auto" />
          </div>
          <div className="asset-meta text-center">
            <div className="asset-filename text-sm font-medium text-gray-900 truncate">
              ..
            </div>
          </div>
        </div>
      )}

      {subfolders.map((folderItem, index) => (
        <FolderTile
          key={index}
          folder={folderItem}
          canEdit={canEdit}
          onSelected={onFolderSelected}
          onEditing={onFolderEditing}
          onDeleting={(folder) => {
            // Handle folder deletion
            console.log('Delete folder:', folder);
          }}
        />
      ))}

      {assets.map((asset) => (
        <AssetTile
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
    </div>
  );
};
