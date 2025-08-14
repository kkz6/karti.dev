import React, { useState, useEffect } from 'react';
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
        const response = await fetch('/api/media/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            ...form,
            path: typeof path === 'string' ? path : path?.path,
            container: container,
            parent_id: parentUuid
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 422) {
            setErrors([errorData.message || 'Validation error']);
          } else {
            setErrors(['Unable to create folder']);
          }
          setSaving(false);
          return;
        }

        const data = await response.json();
        // Show success toast
        const event = new CustomEvent('toast', { 
          detail: { type: 'success', message: 'Folder created successfully' }
        });
        window.dispatchEvent(event);
        
        onCreated?.(data);
      } else {
        // Update folder
        const folderToUpdate = path as MediaFolder;
        const response = await fetch(`/api/media/folders/${folderToUpdate.uuid}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            ...form,
            path: folderToUpdate.path,
            container: container,
            parent_id: parentUuid
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 422) {
            setErrors([errorData.message || 'Validation error']);
          } else {
            setErrors(['Unable to update folder']);
          }
          setSaving(false);
          return;
        }

        const data = await response.json();
        // Show success toast
        const event = new CustomEvent('toast', { 
          detail: { type: 'success', message: 'Folder updated successfully' }
        });
        window.dispatchEvent(event);
        
        onUpdated?.(data);
      }

      handleClose();
    } catch (error) {
      setErrors(['Network error occurred']);
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
