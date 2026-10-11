import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { continueWithoutUnsavedChangesPrompt } from '@shared/components/unsaved-changes-guard';
import AppLayout from '@shared/layouts/app-layout';
import type { BreadcrumbItem } from '@shared/types';
import axios from 'axios';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import CustomerForm from '../pages/customers/form';
import RecurringForm from '../pages/recurring/form';
import ServiceForm from '../pages/services/form';
import TaxRateForm from '../pages/tax-rates/form';
import { BillingFeedback } from './billing-feedback';
import { BillingPageContainer } from './billing-page-container';
import { useBillingConfirm } from './use-billing-confirm';
type Kind = 'customer' | 'service' | 'tax' | 'recurring';
const config = {
    customer: { title: 'Add customer', description: 'Billing details and preferred invoice currency.', route: 'admin.customers.create' },
    service: { title: 'Add service', description: 'Save a reusable service and its price.', route: 'admin.services.create' },
    tax: { title: 'Add tax preset', description: 'Give the percentage rate a name for future invoices.', route: 'admin.tax-rates.create' },
    recurring: {
        title: 'Create recurring schedule',
        description: 'Choose a template and repeat billing schedule.',
        route: 'admin.recurring-invoices.create',
    },
};
type ModalContext = {
    onStateChange: (dirty: boolean, busy: boolean) => void;
    requestClose: () => Promise<void>;
    visitOptions: { headers: Record<string, string>; onSuccess: () => void };
};
const Context = createContext<ModalContext | null>(null);
export function useBillingModalForm(form: { isDirty: boolean; processing: boolean }) {
    const modal = useContext(Context);
    const onStateChange = modal?.onStateChange;
    useEffect(() => onStateChange?.(form.isDirty, form.processing), [onStateChange, form.isDirty, form.processing]);
    return modal;
}
export function BillingFormFrame({ children, breadcrumbs }: { children: ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    const modal = useContext(Context);
    return modal ? <>{children}</> : <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
}
export function BillingFormCanvas({ children, className }: { children: ReactNode; className?: string }) {
    const modal = useContext(Context);
    return modal ? <div className="space-y-5">{children}</div> : <BillingPageContainer className={className}>{children}</BillingPageContainer>;
}
export function BillingCreateModal({ kind, open, onClose }: { kind: Kind; open: boolean; onClose: () => void }) {
    const [seed, setSeed] = useState<Record<string, unknown> | null>(null),
        [loading, setLoading] = useState(false),
        [error, setError] = useState(''),
        [dirty, setDirty] = useState(false),
        [busy, setBusy] = useState(false);
    const { confirm, dialog } = useBillingConfirm();
    useEffect(() => {
        if (!open) return;
        const abort = new AbortController();
        setSeed(null);
        setError('');
        setDirty(false);
        setBusy(false);
        setLoading(true);
        axios
            .get(route(config[kind].route), { headers: { Accept: 'application/json' }, signal: abort.signal })
            .then(({ data }) => setSeed(data))
            .catch((e) => {
                if (!axios.isCancel(e)) setError('The form could not be loaded. Close and try again.');
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoading(false);
            });
        return () => abort.abort();
    }, [open, kind]);
    const onStateChange = useCallback((isDirty: boolean, isBusy: boolean) => {
        setDirty(isDirty);
        setBusy(isBusy);
    }, []);
    const requestClose = useCallback(async () => {
        if (busy || loading) return;
        if (dirty && !(await confirm('Discard your unsaved changes?'))) return;
        continueWithoutUnsavedChangesPrompt(onClose);
    }, [busy, loading, dirty, confirm, onClose]);
    const created = useCallback(() => {
        setDirty(false);
        continueWithoutUnsavedChangesPrompt(onClose);
    }, [onClose]);
    const modal = useMemo(
        () => ({ onStateChange, requestClose, visitOptions: { headers: { 'X-Billing-Modal': '1' }, onSuccess: created } }),
        [onStateChange, requestClose, created],
    );
    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (!value) void requestClose();
                }}
            >
                <DialogContent
                    className={
                        kind === 'tax'
                            ? 'flex max-h-[90dvh] flex-col overflow-hidden p-0 sm:max-w-lg'
                            : 'flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-3xl'
                    }
                    onInteractOutside={(event) => event.preventDefault()}
                    onEscapeKeyDown={(event) => {
                        event.preventDefault();
                        void requestClose();
                    }}
                >
                    <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
                        <DialogTitle>{config[kind].title}</DialogTitle>
                        <DialogDescription>{config[kind].description}</DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                        {loading && (
                            <div role="status" className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                                <LoaderCircle className="size-4 animate-spin" />
                                Loading…
                            </div>
                        )}
                        {error && <BillingFeedback kind="error">{error}</BillingFeedback>}
                        {seed && (
                            <Context.Provider value={modal}>
                                {kind === 'customer' ? (
                                    <CustomerForm {...(seed as ComponentProps<typeof CustomerForm>)} />
                                ) : kind === 'service' ? (
                                    <ServiceForm {...(seed as ComponentProps<typeof ServiceForm>)} />
                                ) : kind === 'tax' ? (
                                    <TaxRateForm {...(seed as ComponentProps<typeof TaxRateForm>)} />
                                ) : (
                                    <RecurringForm {...(seed as ComponentProps<typeof RecurringForm>)} />
                                )}
                            </Context.Provider>
                        )}
                    </div>
                    {error && (
                        <div className="border-t px-5 py-4">
                            <Button variant="outline" onClick={() => void requestClose()}>
                                Close
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {dialog}
        </>
    );
}
