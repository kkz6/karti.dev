import { router, useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { toast } from 'sonner';
import { BillingFeedback } from './billing-feedback';
import { useBillingConfirm } from './use-billing-confirm';
export type PrivateInvoiceLink = { id: number; label: string | null; expires_at: string; revoked_at: string | null };
export function InvoiceLinks({
    invoiceId,
    canShare,
    links,
    shareUrl,
    embedded = false,
}: {
    invoiceId: number;
    canShare: boolean;
    links: PrivateInvoiceLink[] | null;
    shareUrl: string | null;
    embedded?: boolean;
}) {
    const form = useForm({ days: '90', label: '' });
    const { confirm, dialog } = useBillingConfirm();
    if (links === null) return null;
    return (
        <Card className={embedded ? 'rounded-none border-0 bg-transparent' : undefined}>
            <CardHeader className={embedded ? 'px-0 pt-0 pb-3' : undefined}>
                <CardTitle>Private invoice links</CardTitle>
            </CardHeader>
            <CardContent className={embedded ? 'space-y-4 p-0' : 'space-y-4'}>
                {dialog}
                <p className="text-muted-foreground text-sm">
                    Anyone with a valid link can view this invoice, download its PDF, and pay online when configured. Revoke a link to remove access.
                </p>
                {shareUrl && (
                    <div className="space-y-2">
                        <Label htmlFor="invoice-share-url">New private link</Label>
                        <Input id="invoice-share-url" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
                        <Button
                            variant="outline"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(shareUrl);
                                    toast.success('Invoice link copied.');
                                } catch {
                                    toast.error('Copy the invoice link from the field above.');
                                }
                            }}
                        >
                            Copy link
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                                Open payment link
                            </a>
                        </Button>
                    </div>
                )}
                {canShare && (
                    <form
                        className="grid gap-3 sm:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(route('admin.invoices.links.store', invoiceId), { preserveScroll: true });
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="link-label">Label</Label>
                            <Input id="link-label" maxLength={100} value={form.data.label} onChange={(e) => form.setData('label', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link-days">Expires after days</Label>
                            <Input
                                id="link-days"
                                type="number"
                                min={1}
                                max={365}
                                value={form.data.days}
                                onChange={(e) => form.setData('days', e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" variant="outline" className="w-fit sm:col-span-2" disabled={form.processing}>
                            Create private link
                        </Button>
                    </form>
                )}
                {Object.values(form.errors).length > 0 && (
                    <BillingFeedback kind="error">
                        {Object.values(form.errors).map((error, i) => (
                            <p key={i}>{error}</p>
                        ))}
                    </BillingFeedback>
                )}
                {links.length === 0 && <p className="text-muted-foreground text-sm">No private links created.</p>}
                <ol className="divide-y">
                    {links.map((link) => (
                        <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div>
                                <p className="text-sm">{link.label || `Link #${link.id}`}</p>
                                <p className="text-muted-foreground text-xs">{link.revoked_at ? 'Revoked' : `Expires ${link.expires_at}`}</p>
                            </div>
                            {canShare && !link.revoked_at && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        if (await confirm('Revoke this private invoice link?'))
                                            router.post(route('admin.invoices.links.revoke', [invoiceId, link.id]), {}, { preserveScroll: true });
                                    }}
                                >
                                    Revoke link
                                </Button>
                            )}
                        </li>
                    ))}
                </ol>
            </CardContent>
        </Card>
    );
}
