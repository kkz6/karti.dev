import { Button } from '@shared/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { cn } from '@shared/lib/utils';
import React from 'react';
import type { ConfirmDialogProps } from './types';

export default function ConfirmDialog({
    title,
    message,
    confirmButton,
    cancelButton = false,
    show,
    danger = false,
    variant = null,
    customVariantClass = '',
    onCancel,
    onConfirm = null,
    dialogClassName = '',
    overlayClassName = '',
}: ConfirmDialogProps & { dialogClassName?: string; overlayClassName?: string }): React.ReactElement {
    const finalVariant = variant || (danger ? 'danger' : 'info');

    return (
        <Dialog open={show} onOpenChange={(open) => !open && onCancel?.()}>
            <DialogContent 
                className={cn("gap-3 p-5 sm:max-w-[425px]", dialogClassName)} 
                showCloseButton={false}
                overlayClassName={overlayClassName}
            >
                <DialogHeader className="text-left">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground">{message}</p>
                <DialogFooter className="mt-4">
                    {cancelButton !== false && (
                        <DialogClose asChild>
                            <Button type="button" variant="outline" onClick={onCancel || undefined}>
                                {cancelButton || 'Cancel'}
                            </Button>
                        </DialogClose>
                    )}
                    <Button
                        type="button"
                        variant={finalVariant === 'danger' ? 'destructive' : 'default'}
                        className={cn(customVariantClass)}
                        onClick={onConfirm || undefined}
                    >
                        {confirmButton}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
