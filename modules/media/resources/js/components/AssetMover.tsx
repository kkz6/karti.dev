import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';

interface AssetMoverProps {
  assets: string[];
  container?: string | null;
  folder?: string | null;
  onSaved: (folder: string) => void;
  onClosed: () => void;
}

export const AssetMover: React.FC<AssetMoverProps> = ({
  assets,
  container,
  folder,
  onSaved,
  onClosed
}) => {
  const [show, setShow] = useState<boolean>(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[] | null>(null);

  const warningText = "Moving a file will not update any references to it, which _may_ result in broken links in your site.";

  const hasChanged = selectedFolder !== folder;

  const fieldtypeConfig = {
    container: container
  };

  useEffect(() => {
    setSelectedFolder(folder || null);
  }, [folder]);

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
      await axios.post('/api/media/move', {
        assets,
        folder: selectedFolder,
        container,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertDescription>{warningText}</AlertDescription>
          </Alert>

          {errors && (
            <Alert variant="destructive">
              <AlertDescription>
                {errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select value={selectedFolder || ''} onValueChange={setSelectedFolder}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/">Root</SelectItem>
                {/* You'll need to implement folder options based on your API */}
                {/* This would typically come from a hook that fetches available folders */}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!hasChanged || saving}
            className="w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
