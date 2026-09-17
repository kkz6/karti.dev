import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MediaContainer, MediaFolder } from '../../../types/media';

interface FolderEditorProps {
    container: MediaContainer;
    path: string | MediaFolder | null;
    parentUuid?: string | null;
    create: boolean;
    onCreated?: (folder: MediaFolder) => void;
    onUpdated?: (folder: MediaFolder) => void;
    onClosed: () => void;
}

interface FolderForm {
    basename: string;
}

export const FolderEditor: React.FC<FolderEditorProps> = ({ container, path, parentUuid = null, create, onCreated, onUpdated, onClosed }) => {
    const [form, setForm] = useState<FolderForm>({ basename: '' });
    const [saving, setSaving] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);
    const savingRef = useRef(false);

    useEffect(() => {
        // Initialize form data
        if (typeof path === 'object' && path && !create) {
            setForm({ basename: path.title });
        }
    }, [path, create]);

    const hasErrors = errors.length > 0 && !saving;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, basename: e.target.value });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
        }
    };

    const handleSave = async () => {
        const basename = form.basename.trim();
        if (savingRef.current || !basename) return;
        if (/[\\/]/.test(basename) || [...basename].some((character) => character.charCodeAt(0) < 32) || basename === '.' || basename === '..') {
            setErrors(['Use a folder name without slashes or relative path segments.']);
            return;
        }
        savingRef.current = true;
        setSaving(true);
        setErrors([]);

        try {
            if (create) {
                // Create folder using media-manager.create route
                const currentPath = typeof path === 'string' ? path : path?.path || '/';
                const fullPath = currentPath === '/' ? basename : `${currentPath}/${basename}`.replace(/\/+/g, '/');

                const { data } = await axios.post<{ success: boolean; path: string }>('/admin/media-manager/create', {
                    path: fullPath,
                });

                // Show success toast
                if (!data.success) throw new Error('Could not create the folder. Please try again.');
                toast.success(`Folder "${basename}" created.`);

                // Use the normalized path confirmed by storage.
                const newFolder: MediaFolder & { container_id: string } = {
                    uuid: `folder-${data.path}`,
                    path: data.path,
                    title: basename,
                    parent_path: currentPath === '/' ? null : currentPath,
                    container_id: container.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                onCreated?.(newFolder);
            } else {
                // Update folder
                const folderToUpdate = path as MediaFolder;
                const response = await axios.patch(`/api/media/folder/${folderToUpdate.uuid}/edit`, {
                    ...form,
                    path: folderToUpdate.path,
                    container: container,
                    parent_id: parentUuid,
                });

                // Show success toast
                toast.success('Folder updated successfully');

                onUpdated?.(response.data);
            }

            onClosed();
        } catch (error) {
            let errorMessage = 'Network error occurred';

            if (axios.isAxiosError<{ message?: string }>(error) && error.response) {
                errorMessage = error.response.data?.message || (create ? 'Unable to create folder' : 'Unable to update folder');
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setErrors([errorMessage]);
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (savingRef.current) return;
        onClosed();
    };

    return (
        <Dialog open={true} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-md"
                onEscapeKeyDown={(event) => {
                    if (savingRef.current) event.preventDefault();
                }}
                onPointerDownOutside={(event) => {
                    if (savingRef.current) event.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>{create ? 'Create Folder' : 'Edit Folder'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {hasErrors && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {errors.map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="basename">Folder name</Label>
                        <Input
                            id="basename"
                            value={form.basename}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. blog-images"
                            disabled={saving}
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !form.basename.trim()}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
