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
import React, { useMemo } from 'react';
import DynamicIcon from './DynamicIcon';
import type { ConfirmDialogProps } from './types';

export default function ConfirmDialog({
    title,
    message,
    confirmButton,
    cancelButton = false,
    show,
    danger = false,
    variant = null,
    customVariantClass = '', // Keep for backward compatibility but not used
    onCancel,
    onConfirm = null,
    icon = null,
    iconResolver,
}: ConfirmDialogProps): React.ReactElement {
    const finalVariant = variant || (danger ? 'danger' : 'info');

    const iconElement = useMemo(() => {
        if (!icon || !iconResolver) {
            return null;
        }

        return (
            <div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
                <DynamicIcon className="text-muted-foreground size-6" resolver={iconResolver as any} icon={icon} />
            </div>
        );
    }, [icon, iconResolver]);

    return (
        <AlertDialog open={show} onOpenChange={(open) => !open && onCancel?.()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    {iconElement}
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {cancelButton !== false && <AlertDialogCancel onClick={onCancel || undefined}>{cancelButton || 'Cancel'}</AlertDialogCancel>}
                    <AlertDialogAction
                        className={finalVariant === 'danger' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
                        onClick={onConfirm || undefined}
                    >
                        {confirmButton}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
