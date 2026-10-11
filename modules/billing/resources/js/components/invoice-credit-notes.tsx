import { Link, useForm } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { statusTone } from '@shared/lib/status-colors';
import { FileMinus2 } from 'lucide-react';
import { useState } from 'react';
import { BillingFeedback } from './billing-feedback';
export type CreditData = {
    id: number;
    invoice_id: number;
    customer_id: number;
    currency: string;
    status: string;
    formatted_number: string | null;
    reason: string;
    version: number;
    credit_date: string;
    total: string;
    subtotal: string;
    taxes: { name: string; percentage: string; amount: string }[];
    settlement: { allocated: string; refunded: string; available: string };
    cancellation_reason: string | null;
    seller_snapshot: Record<string, string>;
    customer_snapshot: Record<string, string>;
};
export function InvoiceCreditNotes({
    invoiceId,
    currency,
    today,
    canCreate,
    credits,
    embedded = false,
}: {
    invoiceId: number;
    currency: string;
    today: string;
    canCreate: boolean;
    credits: CreditData[] | null;
    embedded?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({ amount: '', credit_date: today, reason: '', request_key: '' });
    if (!canCreate && credits === null) return null;
    return (
        <Card className={embedded ? 'rounded-none border-0 bg-transparent' : undefined}>
            <CardHeader className={embedded ? 'px-0 pt-0 pb-3' : undefined}>
                <CardTitle>Credit notes</CardTitle>
            </CardHeader>
            <CardContent className={embedded ? 'space-y-4 p-0' : 'space-y-4'}>
                {canCreate && (
                    <Button
                        variant="outline"
                        onClick={() => {
                            form.clearErrors();
                            form.setData({ amount: '', credit_date: today, reason: '', request_key: crypto.randomUUID() });
                            setOpen(true);
                        }}
                    >
                        Create credit note
                    </Button>
                )}
                {credits?.length === 0 && (
                    <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-5">
                        <FileMinus2 className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium">No credit notes yet</p>
                            <p className="text-muted-foreground mt-1 text-sm">Credits created from this invoice will appear here.</p>
                        </div>
                    </div>
                )}
                <ol className="divide-y empty:hidden">
                    {credits?.map((c) => (
                        <li className="flex flex-wrap justify-between gap-3 py-3 text-sm" key={c.id}>
                            <Link className="underline" href={route('admin.credit-notes.show', c.id)}>
                                {c.formatted_number ?? `Draft credit #${c.id}`}
                            </Link>
                            <span>
                                {c.total} {c.currency}{' '}
                                <Badge className="ml-2" variant={statusTone(c.status)}>
                                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                </Badge>
                            </span>
                        </li>
                    ))}
                </ol>
                <Dialog
                    open={open}
                    onOpenChange={(v) => {
                        if (!form.processing) setOpen(v);
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create credit note draft</DialogTitle>
                            <DialogDescription>
                                Credit the original invoice, including proportional original tax amounts. Review and issue before allocation or
                                recording a refund.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(route('admin.invoices.credit-notes.store', invoiceId), { onSuccess: () => setOpen(false) });
                            }}
                        >
                            {Object.values(form.errors).length > 0 && (
                                <BillingFeedback kind="error">
                                    {Object.values(form.errors).map((error, i) => (
                                        <p key={i}>{error}</p>
                                    ))}
                                </BillingFeedback>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="credit-amount">Credit amount ({currency})</Label>
                                <Input
                                    id="credit-amount"
                                    inputMode="decimal"
                                    value={form.data.amount}
                                    onChange={(e) => form.setData('amount', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="credit-date">Credit date</Label>
                                <DateField
                                    id="credit-date"
                                    label="Credit date"
                                    value={form.data.credit_date}
                                    onChange={(v) => form.setData('credit_date', v)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="credit-reason">Credit reason</Label>
                                <Textarea
                                    id="credit-reason"
                                    value={form.data.reason}
                                    onChange={(e) => form.setData('reason', e.target.value)}
                                    required
                                    maxLength={2000}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={form.processing}>
                                    Close
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    Create credit draft
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
