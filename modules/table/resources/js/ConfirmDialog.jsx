import React, { useMemo } from 'react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@shared/components/ui/alert-dialog'
import DynamicIcon from './DynamicIcon.tsx'

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
}) {
    if (!variant) {
        variant = danger ? 'danger' : 'info'
    }

    const iconElement = useMemo(() => {
        if (!icon) {
            return null
        }

        return (
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <DynamicIcon
                    className="size-6 text-muted-foreground"
                    resolver={iconResolver}
                    icon={icon}
                />
            </div>
        )
    }, [icon, iconResolver])

    return (
        <AlertDialog open={show} onOpenChange={(open) => !open && onCancel?.()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    {iconElement}
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {cancelButton !== false && (
                        <AlertDialogCancel onClick={onCancel}>
                            {cancelButton}
                        </AlertDialogCancel>
                    )}
                    <AlertDialogAction
                        className={variant === 'danger' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
                        onClick={onConfirm}
                    >
                        {confirmButton}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
