import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { ChevronDown, ChevronUp, CornerLeftUp } from 'lucide-react';
import React, { useState } from 'react';
import { MediaAsset, MediaFolder } from '@media/types/media';
import { FileIcon } from '@media/components';
import { AssetRow } from './AssetRow';
import { FolderRow } from './FolderRow';
import { MediaService } from '@media/services/MediaService';
import { toast } from 'sonner';

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
    onAssetDownloading: (assetId: string) => void;
    onAssetDoubleClicked: (asset: MediaAsset) => void;
    onSorted: (field: string) => void;
    onFolderDeleted?: () => void;
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
    onAssetDownloading,
    onAssetDoubleClicked,
    onSorted,
    onFolderDeleted,
}) => {
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [deleteFolderSelected, setDeleteFolderSelected] = useState<MediaFolder | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [currentSort, setCurrentSort] = useState<string>('title');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const mediaService = new MediaService();

    const columns: Column[] = [
        {
            field: 'title',
            label: 'Title',
        },
        {
            field: 'size',
            label: 'File Size',
            extra: true,
        },
        {
            field: 'lastModified',
            label: 'Date Modified',
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
            } catch (error) {
            } finally {
                setDeleting(false);
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
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="w-12"></th>
                                <th className="w-12"></th>
                                {columns.map((column, index) => (
                                    <th
                                        key={index}
                                        className={`p-3 text-left font-medium text-gray-900 dark:text-gray-100 ${column.extra ? 'hidden md:table-cell' : ''} ${
                                            !isSearching ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                                        }`}
                                        onClick={() => handleSort(column.field)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.label}
                                            {isColumnActive(column) &&
                                                (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                        </div>
                                    </th>
                                ))}
                                <th className="hidden w-20 md:table-cell">Actions</th>
                                <th className="w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasParent && !restrictNavigation && (
                                <tr className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                    <td className="p-3" onDoubleClick={handleParentSelect}>
                                        <div className="flex h-8 w-8 items-center justify-center">
                                            <CornerLeftUp className="h-4 w-4 text-gray-600" />
                                        </div>
                                    </td>
                                    <td className="p-3" onDoubleClick={handleParentSelect}>
                                        <div className="flex h-8 w-8 items-center justify-center">
                                            <FileIcon extension="folder" className="h-6 w-6" />
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onDoubleClick={handleParentSelect}
                                            className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            ..
                                        </button>
                                    </td>
                                    <td className="hidden p-3 md:table-cell">..</td>
                                    <td className="hidden p-3 md:table-cell">..</td>
                                    <td className="hidden p-3 md:table-cell"></td>
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
                                    onDownloading={onAssetDownloading}
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
                        <Button variant="outline" onClick={cancelDeleteFolder} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteFolder} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
