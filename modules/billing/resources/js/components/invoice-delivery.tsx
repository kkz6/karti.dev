import { router, useForm } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { statusTone } from '@shared/lib/status-colors';
import { useState } from 'react';
import type { InvoiceData } from '../invoice-types';
import { BillingFeedback } from './billing-feedback';
export type Delivery = {
    id: number;
    recipients: string[];
    subject: string;
    kind: string;
    state: string;
    error: string | null;
    created_at: string;
    sent_at: string | null;
    provider_reference?: string | null;
    actor_name?: string;
};
export function InvoiceDelivery({
    invoice,
    canSend,
    deliveries,
    reloadKey = 'deliveries',
    embedded = false,
}: {
    invoice: InvoiceData;
    canSend: boolean;
    deliveries: Delivery[] | null;
    reloadKey?: string;
    embedded?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({ request_key: '', recipients: '', subject: `Invoice ${invoice.formatted_number}`, message: '' });
    const contacts = (invoice.customer_snapshot as { contacts?: { email?: string }[] }).contacts ?? [];
    return (
        <>
            <Card className={embedded ? 'rounded-none border-0 bg-transparent' : undefined}>
                <CardHeader className={embedded ? 'px-0 pt-0 pb-3' : undefined}>
                    <CardTitle>Invoice email</CardTitle>
                </CardHeader>
                <CardContent className={embedded ? 'space-y-4 p-0' : 'space-y-4'}>
                    {canSend && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                form.clearErrors();
                                form.setData({
                                    request_key: crypto.randomUUID(),
                                    recipients: contacts
                                        .map((contact) => contact.email)
                                        .filter(Boolean)
                                        .join(', '),
                                    subject: `Invoice ${invoice.formatted_number}`,
                                    message: '',
                                });
                                setOpen(true);
                            }}
                        >
                            Email invoice
                        </Button>
                    )}
                    {deliveries !== null && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-muted-foreground text-sm">Each send or intentional resend keeps a separate record.</p>
                                <Button variant="ghost" onClick={() => router.reload({ only: [reloadKey] })}>
                                    Refresh history
                                </Button>
                            </div>
                            {deliveries.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No email attempts.</p>
                            ) : (
                                <ol className="divide-y">
                                    {deliveries.map((delivery) => (
                                        <li key={delivery.id} className="space-y-2 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant={statusTone(delivery.state)}>{delivery.state}</Badge>
                                                <span className="text-sm">{delivery.subject}</span>
                                            </div>
                                            <p className="text-muted-foreground text-sm break-all">
                                                {delivery.recipients.join(', ')} · {delivery.created_at}
                                            </p>
                                            {delivery.actor_name && (
                                                <p className="text-muted-foreground text-xs">Requested by {delivery.actor_name}</p>
                                            )}
                                            {delivery.provider_reference && (
                                                <p className="text-muted-foreground text-xs break-all">
                                                    Provider reference: {delivery.provider_reference}
                                                </p>
                                            )}
                                            {delivery.sent_at && <p className="text-sm">Provider accepted: {delivery.sent_at}</p>}
                                            {delivery.error && <BillingFeedback kind="error">{delivery.error}</BillingFeedback>}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (!form.processing) setOpen(value);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Email invoice</DialogTitle>
                        <DialogDescription>
                            The selected recipients will receive the saved invoice PDF. Sending again creates a new delivery attempt.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.transform((data) => ({
                                ...data,
                                recipients: data.recipients
                                    .split(/[\n,;]+/)
                                    .map((email) => email.trim())
                                    .filter(Boolean),
                            }));
                            form.post(route('admin.invoices.send', invoice.id), { preserveScroll: true, onSuccess: () => setOpen(false) });
                        }}
                    >
                        {Object.keys(form.errors).length > 0 && (
                            <BillingFeedback kind="error">
                                {Object.values(form.errors).map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </BillingFeedback>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="invoice-email-recipients">Recipients</Label>
                            <Textarea
                                id="invoice-email-recipients"
                                value={form.data.recipients}
                                onChange={(e) => form.setData('recipients', e.target.value)}
                                required
                                disabled={form.processing}
                            />
                            <p className="text-muted-foreground text-xs">Separate email addresses with commas. Up to ten recipients.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-email-subject">Subject</Label>
                            <Input
                                id="invoice-email-subject"
                                value={form.data.subject}
                                onChange={(e) => form.setData('subject', e.target.value)}
                                maxLength={255}
                                required
                                disabled={form.processing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-email-message">Message</Label>
                            <Textarea
                                id="invoice-email-message"
                                value={form.data.message}
                                onChange={(e) => form.setData('message', e.target.value)}
                                maxLength={5000}
                                disabled={form.processing}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={form.processing} onClick={() => setOpen(false)}>
                                Close
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Queueing…' : 'Queue email'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
