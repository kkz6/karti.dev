import { router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';
import type { InvoiceData } from '../invoice-types';
import { InvoiceDelivery, type Delivery, type DeliveryConfiguration } from './invoice-delivery';
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
    sendOnOpen = false,
    deliveries,
    configuration = null,
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
    sendOnOpen?: boolean;
    deliveries: Delivery[] | null;
    configuration?: DeliveryConfiguration | null;
    canRemind: boolean;
    remindersDisabled: boolean;
}) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [updatingReminders, setUpdatingReminders] = useState(false);
    const hasDelivery = canSend || deliveries !== null;
    const hasSharing = links !== null || canRemind;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                ref={contentRef}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    contentRef.current?.focus();
                }}
                className="bg-card flex max-h-[90dvh] flex-col gap-0 overflow-clip p-0 sm:max-w-2xl"
                overlayClassName="bg-black/45"
                onCloseAutoFocus={onCloseAutoFocus}
            >
                <DialogHeader className="shrink-0 p-5 pr-10 text-left sm:p-6 sm:pr-12">
                    <DialogTitle>Send & sharing</DialogTitle>
                    <DialogDescription>{invoice.formatted_number}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue={hasDelivery ? 'delivery' : 'sharing'} className="flex min-h-0 flex-col">
                    {hasDelivery && hasSharing && (
                        <TabsList className="mx-5 mb-2 grid shrink-0 grid-cols-2 sm:mx-6" aria-label="Send and sharing options">
                            <TabsTrigger value="delivery">Email & SMS</TabsTrigger>
                            <TabsTrigger value="sharing">Links & reminders</TabsTrigger>
                        </TabsList>
                    )}
                    <div className="min-h-0 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
                        {(canSend || deliveries !== null) && (
                            <TabsContent value="delivery" className="mt-2">
                                <InvoiceDelivery
                                    embedded
                                    invoice={invoice}
                                    canSend={canSend}
                                    deliveries={deliveries}
                                    configuration={configuration}
                                    initialOpen={sendOnOpen && canSend}
                                />
                            </TabsContent>
                        )}
                        {hasSharing && (
                            <TabsContent value="sharing" className="mt-2 space-y-6">
                                {links !== null && (
                                    <InvoiceLinks embedded invoiceId={invoice.id} canShare={canShare} links={links} shareUrl={shareUrl} />
                                )}
                                {canRemind && (
                                    <section className="flex items-start justify-between gap-4 border-t pt-5">
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
                            </TabsContent>
                        )}
                    </div>
                </Tabs>
                <DialogFooter className="shrink-0 border-t px-5 py-4 sm:px-6">
                    <DialogClose asChild>
                        <Button variant="outline">Done</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
