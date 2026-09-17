import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { ChevronDown, Copy, Save } from 'lucide-react';
import { useState } from 'react';

export function SaveDropdown({
    onSave,
    onSaveAsCopy,
    isSaving = false,
    hasChanges = false,
    disabled = false,
}: {
    onSave: () => void;
    onSaveAsCopy: () => void;
    isSaving?: boolean;
    hasChanges?: boolean;
    disabled?: boolean;
}) {
    const [confirm, setConfirm] = useState(false);
    return (
        <>
            <div role="group" aria-label="Save image" className="image-editor-save inline-flex shrink-0">
                <Button type="button" onClick={() => setConfirm(true)} disabled={disabled || isSaving || !hasChanges}>
                    <Save className="size-4" />
                    {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" size="icon" disabled={disabled || isSaving} aria-label="More save options">
                            <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end">
                        <DropdownMenuItem disabled={!hasChanges} onSelect={() => setConfirm(true)}>
                            <Save className="size-4" />
                            Replace original
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={onSaveAsCopy}>
                            <Copy className="size-4" />
                            Save as a copy
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <AlertDialog open={confirm} onOpenChange={setConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Replace the original image?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This saves your edits over the original file. Choose “Save as a copy” from the save menu to keep the original.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onSave}>Replace original</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
