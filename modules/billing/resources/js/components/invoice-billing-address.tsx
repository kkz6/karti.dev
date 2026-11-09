import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

const addressFields = {
    billing_address: 'Address',
    billing_address_line_2: 'Address line 2',
    billing_city: 'City',
    billing_state: 'State',
    billing_postal_code: 'Postal code',
    billing_country: 'Country code',
};

export function InvoiceBillingAddress({
    snapshot,
    value,
    refresh,
    disabled,
    onApply,
}: {
    snapshot: Record<string, unknown>;
    value: Record<string, string>;
    refresh: boolean;
    disabled: boolean;
    onApply: (value: Record<string, string>, refresh: boolean) => void;
}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [refreshDraft, setRefreshDraft] = useState(false);
    const current = { ...snapshot, ...value };
    return (
        <section className="space-y-2" aria-label="Invoice billing address">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Bill to</h2>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Edit billing address"
                    disabled={disabled}
                    onClick={() => {
                        setDraft(
                            Object.fromEntries(
                                ['display_name', 'legal_name', ...Object.keys(addressFields)].map((key) => [key, String(current[key] ?? '')]),
                            ),
                        );
                        setRefreshDraft(refresh);
                        setOpen(true);
                    }}
                >
                    <Pencil className="size-3.5" />
                </Button>
            </div>
            <p className="text-sm">{String(current.legal_name || current.display_name || '')}</p>
            <p className="text-muted-foreground max-w-lg text-sm whitespace-pre-line">
                {Object.keys(addressFields)
                    .map((key) => current[key])
                    .filter(Boolean)
                    .join(', ')}
            </p>
            {refresh && <p className="text-muted-foreground text-xs">The customer’s current billing details will be used when you save.</p>}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="sm:max-w-lg"
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') event.stopPropagation();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Billing address</DialogTitle>
                        <DialogDescription>Update the address on this invoice.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {Object.entries(addressFields).map(([field, label]) => (
                            <div
                                key={field}
                                className={
                                    field === 'billing_address' || field === 'billing_address_line_2' ? 'space-y-2 sm:col-span-2' : 'space-y-2'
                                }
                            >
                                <Label htmlFor={`billing-${field}`}>{label}</Label>
                                <Input
                                    id={`billing-${field}`}
                                    value={draft[field] ?? ''}
                                    disabled={refreshDraft}
                                    maxLength={field === 'billing_country' ? 2 : 255}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            [field]: field === 'billing_country' ? event.target.value.toUpperCase() : event.target.value,
                                        })
                                    }
                                />
                            </div>
                        ))}
                    </div>
                    <Label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={refreshDraft} onCheckedChange={(value) => setRefreshDraft(value === true)} />
                        Use the customer’s current billing details
                    </Label>
                    <DialogFooter className="gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                onApply(draft, refreshDraft);
                                setOpen(false);
                            }}
                        >
                            Apply address
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
