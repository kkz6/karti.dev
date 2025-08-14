import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { MediaFolder, MediaContainer } from '../../types/media';

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

export const FolderEditor: React.FC<FolderEditorProps> = ({
  container,
  path,
  parentUuid = null,
  create,
  onCreated,
  onUpdated,
  onClosed
}) => {
  const [form, setForm] = useState<FolderForm>({ basename: '' });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Initialize form data
    if (typeof path === 'object' && path && !create) {
      setForm({ basename: path.title });
    }
    setLoading(false);
  }, [path, create]);

  const hasErrors = errors.length > 0 && !saving;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, basename: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);

    try {
      if (create) {
        // Create folder
        const response = await axios.post('/api/media/folder', {
          ...form,
          path: typeof path === 'string' ? path : path?.path,
          container: container,
          parent_id: parentUuid
        });

        // Show success toast
        const event = new CustomEvent('toast', { 
          detail: { type: 'success', message: 'Folder created successfully' }
        });
        window.dispatchEvent(event);
        
        onCreated?.(response.data);
      } else {
        // Update folder
        const folderToUpdate = path as MediaFolder;
        const response = await axios.patch(`/api/media/folder/${folderToUpdate.uuid}/edit`, {
          ...form,
          path: folderToUpdate.path,
          container: container,
          parent_id: parentUuid
        });

        // Show success toast
        const event = new CustomEvent('toast', { 
          detail: { type: 'success', message: 'Folder updated successfully' }
        });
        window.dispatchEvent(event);
        
        onUpdated?.(response.data);
      }

      handleClose();
    } catch (error: any) {
      let errorMessage = 'Network error occurred';
      
      if (error.response) {
        if (error.response.status === 422) {
          errorMessage = error.response.data?.message || 'Validation error';
        } else {
          errorMessage = create ? 'Unable to create folder' : 'Unable to update folder';
        }
      }
      
      setErrors([errorMessage]);
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClosed();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {create ? 'Create Folder' : 'Edit Folder'}
          </DialogTitle>
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
            <Label htmlFor="basename">Name</Label>
            <Input
              id="basename"
              value={form.basename}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="The filesystem directory name"
              disabled={saving}
              autoFocus
            />
            <p className="text-sm text-gray-500">
              The filesystem directory name
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.basename.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
