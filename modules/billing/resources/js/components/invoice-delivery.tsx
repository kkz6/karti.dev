import { router, useForm, usePage } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { PhoneInput } from '@shared/components/ui/phone-input';
import { Textarea } from '@shared/components/ui/textarea';
import { statusTone } from '@shared/lib/status-colors';
import axios from 'axios';
import { LoaderCircle, Mail, MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { InvoiceData } from '../invoice-types';
import { deliveryTime, watchDelivery, type DeliveryEcho } from '../lib/delivery-history';
import { parseRecipients, validEmail } from '../lib/recipients';
import { BillingFeedback } from './billing-feedback';
import { BillingSelect, BillingSelectItem } from './billing-select';
import { EmailRecipients } from './email-recipients';
export type DeliveryConfiguration = {
    smsEnabled: boolean;
    smsProvider: 'twilio' | 'msg91';
    smsMessage: string;
    emailSubject: string;
    emailMessage: string;
};
export type Delivery = {
    channel?: 'email' | 'sms';
    provider?: string | null;
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
    configuration = null,
    reloadKey = 'deliveries',
    embedded = false,
    initialOpen = false,
}: {
    invoice: InvoiceData;
    canSend: boolean;
    deliveries: Delivery[] | null;
    configuration?: DeliveryConfiguration | null;
    reloadKey?: string;
    embedded?: boolean;
    initialOpen?: boolean;
}) {
    const { billingRealtime = false } = usePage<{ billingRealtime?: boolean }>().props;
    const shouldWatch = billingRealtime && deliveries !== null;
    useEffect(
        () => watchDelivery((window as Window & { Echo?: DeliveryEcho }).Echo, shouldWatch, invoice.id, () => router.reload({ only: [reloadKey] })),
        [shouldWatch, invoice.id, reloadKey],
    );
    const [history, setHistory] = useState(deliveries);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const sendPending = useRef(false);
    useEffect(() => setHistory(deliveries), [deliveries]);
    async function sendNow(delivery: Delivery) {
        if (sendPending.current) return;
        sendPending.current = true;
        setSendingId(delivery.id);
        try {
            const { data } = await axios.post<{ delivery: Delivery }>(
                route('admin.invoices.deliveries.send-now', [invoice.id, delivery.id]),
                {},
                {
                    headers: { Accept: 'application/json' },
                },
            );
            setHistory((current) => current?.map((item) => (item.id === data.delivery.id ? data.delivery : item)) ?? null);
            router.reload({ only: [reloadKey] });
            if (data.delivery.state === 'sent') toast.success('Email accepted for delivery.');
            else if (data.delivery.state === 'sending') toast.info('This email is already being sent.');
            else toast.error(data.delivery.error || 'This email was not sent. Check its delivery status.');
        } catch {
            toast.error('Could not confirm delivery. Check the delivery history before sending again.');
        } finally {
            sendPending.current = false;
            setSendingId(null);
        }
    }
    const [recipientDraft, setRecipientDraft] = useState('');
    const [open, setOpen] = useState(initialOpen);
    const contacts = (invoice.customer_snapshot as { contacts?: { email?: string; phone?: string }[] }).contacts ?? [];
    const form = useForm({
        channel: 'email' as 'email' | 'sms',
        request_key: crypto.randomUUID(),
        recipients: contacts
            .map((contact) => contact.email)
            .filter(Boolean)
            .join(', '),
        subject: configuration?.emailSubject ?? `Invoice ${invoice.formatted_number}`,
        message: configuration?.emailMessage ?? '',
    });
    const sms = form.data.channel === 'sms';
    function compose(channel: 'email' | 'sms') {
        setRecipientDraft('');
        form.clearErrors();
        form.setData({
            channel,
            request_key: crypto.randomUUID(),
            recipients:
                channel === 'sms'
                    ? (contacts.find((contact) => contact.phone)?.phone ?? '')
                    : contacts
                          .map((contact) => contact.email)
                          .filter(Boolean)
                          .join(', '),
            subject: configuration?.emailSubject ?? `Invoice ${invoice.formatted_number}`,
            message:
                channel === 'sms'
                    ? (configuration?.smsMessage ?? 'Invoice {invoice_number}: {currency} {amount_due}. {invoice_link}')
                    : (configuration?.emailMessage ?? ''),
        });
    }
    return (
        <>
            <Card className={embedded ? 'rounded-none border-0 bg-transparent' : undefined}>
                <CardHeader
                    className={
                        embedded
                            ? 'flex flex-row items-center justify-between gap-3 px-0 pt-0 pb-4'
                            : 'flex flex-row items-center justify-between gap-3'
                    }
                >
                    <CardTitle>Delivery history</CardTitle>
                    {canSend && (
                        <Button
                            size="sm"
                            onClick={() => {
                                compose('email');
                                setOpen(true);
                            }}
                        >
                            <Send className="size-4" /> Send invoice
                        </Button>
                    )}
                </CardHeader>
                <CardContent className={embedded ? 'space-y-3 p-0' : 'space-y-3'}>
                    {history !== null &&
                        (history.length === 0 ? (
                            <div className="text-muted-foreground rounded-lg border border-dashed px-5 py-8 text-center text-sm">
                                <Mail className="mx-auto mb-3 size-6" />
                                No messages sent yet.
                            </div>
                        ) : (
                            <ol className="space-y-3">
                                {history.map((delivery) => (
                                    <li key={delivery.id} className="rounded-lg border p-4">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
                                                aria-hidden="true"
                                            >
                                                {delivery.channel === 'sms' ? <MessageSquare className="size-4" /> : <Mail className="size-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-medium break-words">{delivery.subject}</p>
                                                    <Badge variant={statusTone(delivery.state)}>
                                                        {{
                                                            queued: 'Queued',
                                                            sending: 'Sending',
                                                            sent: 'Sent',
                                                            failed: 'Failed',
                                                            uncertain: 'Unconfirmed',
                                                            skipped: 'Skipped',
                                                        }[delivery.state] ?? delivery.state}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground text-sm break-words">{delivery.recipients.join(', ')}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {delivery.sent_at ? 'Accepted ' : 'Requested '}
                                                    <time dateTime={delivery.sent_at ?? delivery.created_at}>
                                                        {deliveryTime(delivery.sent_at ?? delivery.created_at)}
                                                    </time>
                                                    {!delivery.sent_at && delivery.actor_name ? ` · ${delivery.actor_name}` : ''}
                                                </p>
                                                {delivery.channel !== 'sms' && delivery.state === 'queued' && (
                                                    <p className="text-muted-foreground text-xs">Waiting to send. You can send this email now.</p>
                                                )}
                                                {delivery.error && <BillingFeedback kind="error">{delivery.error}</BillingFeedback>}
                                                {canSend && delivery.channel !== 'sms' && delivery.state === 'queued' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={sendingId !== null}
                                                        onClick={() => void sendNow(delivery)}
                                                    >
                                                        {sendingId === delivery.id ? (
                                                            <LoaderCircle className="size-4 animate-spin" />
                                                        ) : (
                                                            <Send className="size-4" />
                                                        )}
                                                        {sendingId === delivery.id ? 'Sending…' : 'Send now'}
                                                    </Button>
                                                )}
                                                {delivery.provider_reference && (
                                                    <details className="text-muted-foreground text-xs">
                                                        <summary className="cursor-pointer">Delivery details</summary>
                                                        <p className="mt-2 break-all">Provider reference: {delivery.provider_reference}</p>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        ))}
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
                        <DialogTitle>Send invoice</DialogTitle>
                        <DialogDescription>
                            {sms
                                ? 'Send a private invoice link by SMS. Each phone number has its own delivery attempt.'
                                : 'The selected recipients receive the saved invoice PDF and a private link. Sending again creates a new attempt.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const emails = parseRecipients([form.data.recipients, recipientDraft].join(','));
                            if (!sms && (!emails.length || emails.length > 10 || emails.some((email) => !validEmail(email)))) {
                                form.setError('recipients', 'Add between one and ten valid email addresses.');
                                return;
                            }
                            form.transform((data) => ({
                                ...data,
                                recipients: data.channel === 'sms' ? [data.recipients] : emails,
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
                            <Label htmlFor="invoice-delivery-channel">Channel</Label>
                            <BillingSelect
                                id="invoice-delivery-channel"
                                value={form.data.channel}
                                disabled={form.processing}
                                onValueChange={(value) => compose(value as 'email' | 'sms')}
                            >
                                <BillingSelectItem value="email">Email</BillingSelectItem>
                                {configuration?.smsEnabled && (
                                    <BillingSelectItem value="sms">SMS · {configuration.smsProvider.toUpperCase()}</BillingSelectItem>
                                )}
                            </BillingSelect>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-email-recipients">{sms ? 'Phone number' : 'Recipients'}</Label>
                            {sms ? (
                                <PhoneInput
                                    id="invoice-email-recipients"
                                    value={form.data.recipients}
                                    onChange={(value) => form.setData('recipients', value)}
                                    defaultCountry={String(invoice.customer_snapshot.billing_country ?? 'IN')}
                                    disabled={form.processing}
                                />
                            ) : (
                                <EmailRecipients
                                    value={form.data.recipients}
                                    draft={recipientDraft}
                                    onDraft={setRecipientDraft}
                                    onChange={(value) => form.setData('recipients', value)}
                                    disabled={form.processing}
                                    suggestions={contacts.flatMap((contact) => (contact.email ? [contact.email] : []))}
                                />
                            )}
                            <p className="text-muted-foreground text-xs">
                                {sms
                                    ? 'Use an international number with its country code.'
                                    : 'Each address receives the same invoice. Remove an address using its × button.'}
                            </p>
                        </div>
                        {!sms && (
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
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="invoice-email-message">
                                {sms && configuration?.smsProvider === 'msg91' ? 'Approved message preview' : 'Message'}
                            </Label>
                            <Textarea
                                id="invoice-email-message"
                                value={form.data.message}
                                onChange={(e) => form.setData('message', e.target.value)}
                                maxLength={sms ? 1600 : 5000}
                                readOnly={sms && configuration?.smsProvider === 'msg91'}
                                disabled={form.processing}
                            />
                        </div>
                        {sms && configuration?.smsProvider === 'msg91' && (
                            <p className="text-muted-foreground text-xs">
                                MSG91 sends the approved invoice template and variable mapping from Delivery settings.
                            </p>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={form.processing} onClick={() => setOpen(false)}>
                                Close
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Queueing…' : sms ? 'Queue SMS' : 'Queue email'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
