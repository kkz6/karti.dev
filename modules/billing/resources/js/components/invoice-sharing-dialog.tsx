import { router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import type { InvoiceData } from '../invoice-types';
import { InvoiceDelivery, type Delivery } from './invoice-delivery';
import { InvoiceLinks, type PrivateInvoiceLink } from './invoice-links';

export function InvoiceSharingDialog({
    open,
    onOpenChange,
    onCloseAutoFocus,
    invoice,
    canShare,
    links,
    shareUrl,
    canSend,
    deliveries,
    canRemind,
    remindersDisabled,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
    invoice: InvoiceData;
    canShare: boolean;
    links: PrivateInvoiceLink[] | null;
    shareUrl: string | null;
    canSend: boolean;
    deliveries: Delivery[] | null;
    canRemind: boolean;
    remindersDisabled: boolean;
}) {
    const [updatingReminders, setUpdatingReminders] = useState(false);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-card flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
                overlayClassName="bg-black/45"
                onCloseAutoFocus={onCloseAutoFocus}
            >
                <DialogHeader className="border-b p-5 pr-10 text-left sm:p-6 sm:pr-12">
                    <DialogTitle>Email & sharing</DialogTitle>
                    <DialogDescription>{invoice.formatted_number} · Manage customer access and delivery.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 space-y-6 overflow-y-auto p-5 sm:p-6 [&>section:not(:last-child)]:border-b [&>section:not(:last-child)]:pb-6">
                    {links !== null && (
                        <section>
                            <InvoiceLinks embedded invoiceId={invoice.id} canShare={canShare} links={links} shareUrl={shareUrl} />
                        </section>
                    )}
                    {(canSend || deliveries !== null) && (
                        <section>
                            <InvoiceDelivery embedded invoice={invoice} canSend={canSend} deliveries={deliveries} />
                        </section>
                    )}
                    {canRemind && (
                        <section className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="invoice-reminders">Automated reminders</Label>
                                <p className="text-muted-foreground text-xs">Uses the reminder schedule in billing settings.</p>
                            </div>
                            <Switch
                                id="invoice-reminders"
                                checked={!remindersDisabled}
                                disabled={updatingReminders}
                                onCheckedChange={(enabled) => {
                                    setUpdatingReminders(true);
                                    router.post(
                                        route('admin.invoices.reminders', invoice.id),
                                        { disabled: !enabled },
                                        { preserveScroll: true, onFinish: () => setUpdatingReminders(false) },
                                    );
                                }}
                            />
                        </section>
                    )}
                </div>
                <DialogFooter className="border-t px-5 py-4 sm:px-6">
                    <DialogClose asChild>
                        <Button variant="outline">Done</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
