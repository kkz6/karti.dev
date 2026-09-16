import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { CornerLeftUp } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { MediaService } from '../../../services/MediaService';
import { MediaAsset, MediaFolder } from '../../../types/media';
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
    onAssetDownloading: (assetId: string) => void;
    onAssetDoubleClicked: (asset: MediaAsset) => void;
    onSorted: (field: string) => void;
    onFolderDeleted?: () => void;
}

export const GridListing: React.FC<GridListingProps> = ({
    assets,
    folder,
    subfolders,
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
    onAssetDownloading,
    onAssetDoubleClicked,
    onFolderDeleted,
}) => {
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [deleteFolderSelected, setDeleteFolderSelected] = useState<MediaFolder | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const mediaService = new MediaService();

    const hasParent = !!folder && folder.parent_path !== null;
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
                created_at: folder.created_at,
                updated_at: folder.updated_at,
            };
            onFolderSelected(parentFolder);
        }
    };

    const handleDeleteFolder = (folderToDelete: MediaFolder) => {
        setDeleteFolderSelected(folderToDelete);
        setDeleteModal(true);
    };

    const confirmDeleteFolder = async () => {
        if (deleteFolderSelected) {
            try {
                setDeleting(true);
                await mediaService.deleteFolder(deleteFolderSelected.path);
                toast.success('Folder deleted successfully');
                setDeleteModal(false);
                setDeleteFolderSelected(null);
                onFolderDeleted?.();
            } catch {
                // MediaService already reports the server error through a toast.
            } finally {
                setDeleting(false);
            }
        }
    };

    const cancelDeleteFolder = () => {
        setDeleteModal(false);
        setDeleteFolderSelected(null);
    };

    return (
        <div className="asset-grid-listing grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {hasParent && !restrictNavigation && (
                <Button type="button" variant="ghost" className="text-muted-foreground col-span-full justify-self-start" onClick={handleParentSelect}>
                    <CornerLeftUp />
                    Parent folder
                </Button>
            )}

            {subfolders.map((folderItem, index) => (
                <FolderTile
                    key={index}
                    folder={folderItem}
                    canEdit={canEdit}
                    onSelected={onFolderSelected}
                    onEditing={onFolderEditing}
                    onDeleting={handleDeleteFolder}
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
                    onDownloading={onAssetDownloading}
                    onDoubleClicked={onAssetDoubleClicked}
                />
            ))}

            <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete the folder selected?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>On clicking confirm the selected item will be deleted. If you don't wish to do it then please press cancel.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelDeleteFolder} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteFolder} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
