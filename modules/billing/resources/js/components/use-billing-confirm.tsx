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
    const resolve = useRef<((accepted: boolean) => void) | null>(null);
    const close = (accepted: boolean) => {
        resolve.current?.(accepted);
        resolve.current = null;
        setMessage(null);
    };
    const confirm = (description: string) =>
        new Promise<boolean>((done) => {
            resolve.current?.(false);
            resolve.current = done;
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
                    <AlertDialogTitle>Confirm change</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => close(false)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction type="button" onClick={() => close(true)}>
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
    return { confirm, dialog };
}
