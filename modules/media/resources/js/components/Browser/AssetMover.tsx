import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { MediaFolder } from '../../types/media';

interface AssetMoverProps {
    assets: string[];
    container?: string | null;
    folder?: string | null;
    onSaved: (folder: string) => void;
    onClosed: () => void;
}

export const AssetMover: React.FC<AssetMoverProps> = ({ assets, container, folder, onSaved, onClosed }) => {
    const [show, setShow] = useState<boolean>(true);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[] | null>(null);
    const [availableFolders, setAvailableFolders] = useState<MediaFolder[]>([]);
    const [loadingFolders, setLoadingFolders] = useState<boolean>(true);

    const warningText = 'Moving a file will not update any references to it, which _may_ result in broken links in your site.';

    const hasChanged = selectedFolder !== folder;

    // Function to recursively fetch all folders
    const fetchAllFolders = async (): Promise<MediaFolder[]> => {
        const allFolders: MediaFolder[] = [];
        const visitedPaths = new Set<string>();

        // Queue of paths to explore
        const pathsToExplore = ['/'];

        while (pathsToExplore.length > 0) {
            const currentPath = pathsToExplore.shift()!;

            if (visitedPaths.has(currentPath)) {
                continue;
            }

            visitedPaths.add(currentPath);

            try {
                const url = currentPath && currentPath !== '/' ? `/admin/media/${currentPath.replace(/^\//, '')}` : '/admin/media';

                const response = await axios.get(url, {
                    params: {
                        disk: 'public',
                        page: 1,
                    },
                });

                const { subdirectories } = response.data;

                // Transform subdirectories to folders format
                const folders: MediaFolder[] = subdirectories.map((dir: any) => ({
                    uuid: `folder-${dir.name}`,
                    path: dir.name,
                    title: dir.name.split('/').pop() || dir.name,
                    parent_path: currentPath === '/' ? null : currentPath,
                    container_id: 'public',
                    created_at: dir.timestamp !== 'N/A' ? dir.timestamp : new Date().toISOString(),
                    updated_at: dir.timestamp !== 'N/A' ? dir.timestamp : new Date().toISOString(),
                }));

                // Add current path folders to all folders
                allFolders.push(...folders);

                // Add subdirectories to paths to explore
                folders.forEach((folderItem) => {
                    if (!visitedPaths.has(folderItem.path)) {
                        pathsToExplore.push(folderItem.path);
                    }
                });
            } catch (error) {
                console.error(`Error fetching folders for path ${currentPath}:`, error);
            }
        }

        return allFolders;
    };

    const fieldtypeConfig = {
        container: container,
    };

    useEffect(() => {
        setSelectedFolder(folder || null);
    }, [folder]);

    useEffect(() => {
        const loadFolders = async () => {
            setLoadingFolders(true);
            try {
                const folders = await fetchAllFolders();
                setAvailableFolders(folders);
            } catch (error) {
                console.error('Error loading folders:', error);
                setErrors(['Failed to load available folders']);
            } finally {
                setLoadingFolders(false);
            }
        };

        loadFolders();
    }, []);

    useEffect(() => {
        if (!show) {
            onClosed();
        }
    }, [show, onClosed]);

    const handleSave = async () => {
        if (!hasChanged) return;

        setSaving(true);
        setErrors(null);

        try {
            await axios.post('/admin/media/move', {
                media_ids: assets.map((id) => parseInt(id)),
                destination: selectedFolder,
                disk: 'public',
            });

            onSaved(selectedFolder!);
            handleCancel();
        } catch (error: any) {
            setSaving(false);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to move assets';
            setErrors([errorMessage]);
        }
    };

    const handleCancel = () => {
        setShow(false);
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogContent className="border-gray-200 bg-white sm:max-w-md dark:border-gray-700 dark:bg-gray-900">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100">Move File</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert className="border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/30">
                        <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                            <span className="font-medium text-yellow-900 dark:text-yellow-100">{warningText}</span>
                        </AlertDescription>
                    </Alert>

                    {errors && (
                        <Alert variant="destructive" className="border-red-400 bg-red-50 shadow-sm dark:border-red-600 dark:bg-red-900/30">
                            <AlertDescription className="text-red-900 dark:text-red-100">
                                {errors.map((error, i) => (
                                    <p key={i} className="text-sm leading-relaxed font-medium text-red-900 dark:text-red-100">
                                        {error}
                                    </p>
                                ))}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="folder" className="text-gray-900 dark:text-gray-100">
                            Folder
                        </Label>
                        <Select value={selectedFolder || ''} onValueChange={setSelectedFolder} disabled={loadingFolders}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingFolders ? 'Loading folders...' : 'Select a folder'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="/">Root</SelectItem>
                                {availableFolders
                                    .sort((a, b) => a.path.localeCompare(b.path))
                                    .map((folderItem) => (
                                        <SelectItem key={folderItem.uuid} value={folderItem.path}>
                                            {folderItem.path}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={!hasChanged || saving || loadingFolders} className="w-full sm:w-auto">
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
