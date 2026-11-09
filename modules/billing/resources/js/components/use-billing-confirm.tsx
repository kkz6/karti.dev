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
import { useRef, useState } from 'react';

export function useBillingConfirm() {
    const [message, setMessage] = useState<string | null>(null);
    const [labels, setLabels] = useState({ title: 'Confirm change', action: 'Continue', cancel: 'Cancel' });
    const resolve = useRef<((accepted: boolean) => void) | null>(null);
    const close = (accepted: boolean) => {
        resolve.current?.(accepted);
        resolve.current = null;
        setMessage(null);
    };
    const confirm = (description: string, options?: { title: string; action: string; cancel: string }) =>
        new Promise<boolean>((done) => {
            resolve.current?.(false);
            resolve.current = done;
            setLabels(options ?? { title: 'Confirm change', action: 'Continue', cancel: 'Cancel' });
            setMessage(description);
        });
    const dialog = (
        <AlertDialog
            open={message !== null}
            onOpenChange={(open) => {
                if (!open) close(false);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{labels.title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => close(false)}>
                        {labels.cancel}
                    </AlertDialogCancel>
                    <AlertDialogAction type="button" onClick={() => close(true)}>
                        {labels.action}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
    return { confirm, dialog };
}
