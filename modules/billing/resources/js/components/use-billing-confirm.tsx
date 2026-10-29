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
            <AlertDialogContent className="gap-0 p-0 sm:max-w-md">
                <AlertDialogHeader className="space-y-3 p-6 text-left">
                    <AlertDialogTitle>Confirm change</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="bg-muted/30 gap-2 rounded-b-lg border-t px-6 py-4 sm:space-x-0">
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
