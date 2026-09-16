import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Check, ListX, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface AssetPickerDialogProps {
    open: boolean;
    title: string;
    selectedCount: number;
    onClose: () => void;
    onConfirm: () => void;
    onClear: () => void;
    children: ReactNode;
}

export function AssetPickerDialog({ open, title, selectedCount, onClose, onConfirm, onClear, children }: AssetPickerDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) onClose();
            }}
        >
            <DialogContent className="media-picker-dialog bg-card flex h-[85dvh] max-h-[56rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
                <DialogHeader className="border-border shrink-0 border-b px-5 py-4 pr-12 text-left">
                    <DialogTitle className="text-base">{title}</DialogTitle>
                    <DialogDescription className="text-xs">Choose from your library or upload new files.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
                <DialogFooter className="border-border bg-muted/20 shrink-0 flex-row flex-wrap items-center justify-between gap-3 border-t px-5 py-3 sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span role="status" className="text-muted-foreground text-sm tabular-nums">
                            {selectedCount ? `${selectedCount} selected` : 'No files selected'}
                        </span>
                        {selectedCount > 0 && (
                            <Button variant="ghost" onClick={onClear}>
                                <ListX aria-hidden="true" />
                                Clear
                            </Button>
                        )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" onClick={onClose}>
                            <X aria-hidden="true" />
                            Cancel
                        </Button>
                        <Button onClick={onConfirm} disabled={selectedCount === 0}>
                            <Check aria-hidden="true" />
                            {selectedCount ? `Add ${selectedCount} ${selectedCount === 1 ? 'file' : 'files'}` : 'Add files'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
