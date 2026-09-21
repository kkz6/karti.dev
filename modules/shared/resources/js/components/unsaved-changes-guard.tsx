import type { PendingVisit, VisitOptions } from '@inertiajs/core';
import { router } from '@inertiajs/react';
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
import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface UnsavedChangesGuardProps {
    dirty: boolean;
}

let allowNextVisit = false;

export function continueWithoutUnsavedChangesPrompt(callback: () => void) {
    allowNextVisit = true;
    callback();
}

function visitOptions(visit: PendingVisit): VisitOptions {
    return {
        method: visit.method,
        data: visit.data,
        replace: visit.replace,
        preserveScroll: visit.preserveScroll,
        preserveState: visit.preserveState,
        only: visit.only,
        except: visit.except,
        headers: visit.headers,
        errorBag: visit.errorBag,
        forceFormData: visit.forceFormData,
        queryStringArrayFormat: visit.queryStringArrayFormat,
        async: visit.async,
        showProgress: visit.showProgress,
        fresh: visit.fresh,
        reset: visit.reset,
        preserveUrl: visit.preserveUrl,
    };
}

export function UnsavedChangesGuard({ dirty }: UnsavedChangesGuardProps) {
    const dirtyRef = useRef(dirty);
    const [pendingVisit, setPendingVisit] = useState<PendingVisit | null>(null);

    useEffect(() => {
        dirtyRef.current = dirty;

        if (!dirty) setPendingVisit(null);
    }, [dirty]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!dirtyRef.current) return;

            event.preventDefault();
            event.returnValue = '';
        };

        const removeBeforeVisitListener = router.on('before', (event) => {
            const visit = event.detail.visit;

            if (allowNextVisit) {
                allowNextVisit = false;
                return;
            }

            // Submissions are the way these forms save. Prefetching never leaves the page.
            if (!dirtyRef.current || visit.method !== 'get' || visit.prefetch) return;

            setPendingVisit(visit);

            return false;
        });

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            removeBeforeVisitListener();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const discardAndContinue = () => {
        if (!pendingVisit) return;

        const visit = pendingVisit;
        setPendingVisit(null);
        continueWithoutUnsavedChangesPrompt(() => router.visit(visit.url, visitOptions(visit)));
    };

    return (
        <AlertDialog open={pendingVisit !== null} onOpenChange={(open) => !open && setPendingVisit(null)}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <div className="bg-destructive/10 text-destructive mb-1 flex size-10 items-center justify-center rounded-full" aria-hidden="true">
                        <TriangleAlert className="size-5" />
                    </div>
                    <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have changes that have not been saved. If you leave this page now, those changes will be lost.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-2">
                    <AlertDialogCancel>Keep editing</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={discardAndContinue}>
                        Discard changes
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
