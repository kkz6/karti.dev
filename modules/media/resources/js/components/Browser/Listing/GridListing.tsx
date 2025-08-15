import React from 'react';
import { MediaAsset, MediaFolder } from '../../../types/media';
import { FileIcon } from '../../FileIcon';
import { AssetTile } from './AssetTile';
import { FolderTile } from './FolderTile';

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
    onSorted,
}) => {
    const hasParent = folder?.parent_path !== null;
    const hasResults = assets.length > 0 || subfolders.length > 0;

    if (!((hasParent && !restrictNavigation) || !isSearching || (isSearching && hasResults))) {
        return null;
    }

    const handleParentSelect = () => {
        if (folder && folder.parent_path !== null) {
            const parentFolder: MediaFolder = {
                uuid: `folder-${folder.parent_path}`,
                path: folder.parent_path || '/',
                title: folder.parent_path === '/' || !folder.parent_path ? 'Root' : folder.parent_path.split('/').pop() || folder.parent_path,
                parent_path: folder.parent_path === '/' || !folder.parent_path ? null : folder.parent_path.split('/').slice(0, -1).join('/') || '/',
                container_id: folder.container_id,
                created_at: folder.created_at,
                updated_at: folder.updated_at,
            };
            onFolderSelected(parentFolder);
        }
    };

    return (
        <div className="asset-grid-listing grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {hasParent && !restrictNavigation && (
                <div className="asset-tile is-folder group cursor-pointer" onDoubleClick={handleParentSelect}>
                    <div className="asset-thumb-container mb-2 rounded-lg bg-gray-100 p-6 transition-colors group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700">
                        <FileIcon extension="folder" className="mx-auto h-12 w-12" />
                    </div>
                    <div className="asset-meta text-center">
                        <div className="asset-filename truncate text-sm font-medium text-gray-900 dark:text-gray-100">..</div>
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
