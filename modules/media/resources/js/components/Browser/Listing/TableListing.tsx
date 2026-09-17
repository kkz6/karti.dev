import { MediaService } from '@media/services/MediaService';
import { MediaAsset, MediaFolder } from '@media/types/media';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { ChevronDown, ChevronUp, CornerLeftUp, Folder } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useMediaMove } from '../MediaMoveContext';
import { AssetRow } from './AssetRow';
import { FolderRow } from './FolderRow';

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
    onToggleSelectAll?: () => void;
    selectAllState?: boolean | 'mixed';
    selectAllDisabled?: boolean;
}

interface Column {
    field: string;
    label: string;
    extra?: boolean;
}

export const TableListing: React.FC<TableListingProps> = ({
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
    onSorted,
    onFolderDeleted,
    onToggleSelectAll,
    selectAllState = false,
    selectAllDisabled = false,
}) => {
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [deleteFolderSelected, setDeleteFolderSelected] = useState<MediaFolder | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [currentSort, setCurrentSort] = useState<string>('title');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const mediaService = new MediaService();
    const move = useMediaMove();

    const columns: Column[] = [
        {
            field: 'title',
            label: 'File',
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

    const hasParent = !!folder && folder.parent_path !== null;
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

    if (!(!isSearching || (isSearching && hasResults))) {
        return null;
    }

    return (
        <>
            <div className="asset-table-listing w-full">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-border border-b">
                                <th scope="col" className="w-10 px-3 py-2">
                                    {onToggleSelectAll ? (
                                        <div className="media-selection-control flex size-8 items-center justify-center">
                                            <Checkbox
                                                checked={selectAllState === 'mixed' ? 'indeterminate' : selectAllState}
                                                onCheckedChange={onToggleSelectAll}
                                                disabled={selectAllDisabled}
                                                aria-label={
                                                    selectAllState === true ? 'Deselect all files on this page' : 'Select all files on this page'
                                                }
                                                title={selectAllState === true ? 'Deselect all files on this page' : 'Select all files on this page'}
                                            />
                                        </div>
                                    ) : (
                                        <span className="sr-only">Selection</span>
                                    )}
                                </th>
                                <th className="w-12">
                                    <span className="sr-only">Preview</span>
                                </th>
                                {columns.map((column, index) => (
                                    <th
                                        key={index}
                                        scope="col"
                                        aria-sort={isColumnActive(column) ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                        className={`text-muted-foreground p-3 text-left text-sm font-medium ${column.extra ? 'hidden md:table-cell' : ''}`}
                                    >
                                        <button
                                            type="button"
                                            disabled={isSearching}
                                            onClick={() => handleSort(column.field)}
                                            className="focus-visible:outline-ring flex items-center gap-2 rounded focus-visible:outline-2"
                                        >
                                            {column.label}
                                            {isColumnActive(column) &&
                                                (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                        </button>
                                    </th>
                                ))}
                                <th scope="col" className="w-14">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasParent && !restrictNavigation && (
                                <tr
                                    {...move?.folderProps(folder?.parent_path || '/')}
                                    className="media-folder-target border-border hover:bg-accent cursor-pointer border-b"
                                >
                                    <td className="p-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleParentSelect}
                                            aria-label="Open parent folder"
                                            className="media-selection-control"
                                        >
                                            <CornerLeftUp className="text-muted-foreground h-4 w-4" />
                                        </Button>
                                    </td>
                                    <td className="p-3" onDoubleClick={handleParentSelect}>
                                        <div className="flex h-8 w-8 items-center justify-center">
                                            <Folder className="text-muted-foreground size-5" />
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <button
                                            type="button"
                                            onClick={handleParentSelect}
                                            className="text-muted-foreground hover:text-foreground focus-visible:outline-ring text-sm focus-visible:outline-2"
                                        >
                                            Parent folder
                                        </button>
                                    </td>
                                    <td className="hidden p-3 md:table-cell">—</td>
                                    <td className="hidden p-3 md:table-cell">—</td>
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
