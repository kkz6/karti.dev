import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useBillingConfirm } from '@billing/components/use-billing-confirm';
import { router, useForm } from '@inertiajs/react';
import InputError from '@shared/components/input-error';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Method = { id: number; name: string; code: string; enabled: boolean; payments_count: number; refunds_count: number };
const showErrors = (errors: Record<string, string>) => toast.error(Object.values(errors).join(' '));
export default function PaymentMethods({ methods, canUpdate }: { methods: Method[]; canUpdate: boolean }) {
    const [editing, setEditing] = useState<Method | 'new' | null>(null);
    const form = useForm({ name: '', enabled: true });
    const { confirm, dialog } = useBillingConfirm();
    function edit(method: Method | 'new') {
        form.clearErrors();
        form.setData(method === 'new' ? { name: '', enabled: true } : { name: method.name, enabled: method.enabled });
        setEditing(method);
    }
    async function remove(method: Method) {
        if (method.payments_count + method.refunds_count) {
            toast.error('This payment method is already used by recorded payments or refunds. Disable it instead of deleting it.');
            return;
        }
        if (await confirm(`Delete ${method.name}? This unused payment method will be removed.`))
            router.delete(route('admin.billing.payment-methods.destroy', method.id), { preserveScroll: true, onError: showErrors });
    }
    return (
        <BillingSettingsWorkspace section="payments">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Payment methods</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage the options available when recording manual payments.</p>
                </div>
                {canUpdate && (
                    <Button onClick={() => edit('new')}>
                        <Plus className="size-4" />
                        Add payment method
                    </Button>
                )}
            </div>
            <Card>
                <CardContent className="divide-y px-5 py-1">
                    {methods.length ? (
                        methods.map((method) => (
                            <div key={method.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                <div>
                                    <p className="font-medium">{method.name}</p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {method.payments_count + method.refunds_count
                                            ? `Used by ${method.payments_count + method.refunds_count} payment or refund records. Disable to keep it out of new payments.`
                                            : 'Not used in any recorded payments or refunds.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        aria-label={`Enable ${method.name}`}
                                        checked={method.enabled}
                                        disabled={!canUpdate}
                                        onCheckedChange={(enabled) =>
                                            router.put(
                                                route('admin.billing.payment-methods.update', method.id),
                                                { name: method.name, enabled },
                                                { preserveScroll: true, onError: showErrors },
                                            )
                                        }
                                    />
                                    {canUpdate && (
                                        <>
                                            <Button variant="ghost" size="icon" aria-label={`Edit ${method.name}`} onClick={() => edit(method)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" aria-label={`Delete ${method.name}`} onClick={() => remove(method)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground py-5 text-sm">No manual payment methods. Add one to start recording payments.</p>
                    )}
                </CardContent>
            </Card>
            <Dialog
                open={editing !== null}
                onOpenChange={(open) => {
                    if (!open && !form.processing) setEditing(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing === 'new' ? 'Add payment method' : 'Edit payment method'}</DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const options = { preserveScroll: true, onSuccess: () => setEditing(null) };
                            if (editing === 'new') form.post(route('admin.billing.payment-methods.store'), options);
                            else if (editing) form.put(route('admin.billing.payment-methods.update', editing.id), options);
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="method-name">Name</Label>
                            <Input
                                id="method-name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                                maxLength={100}
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="method-enabled">Available for new payments</Label>
                            <Switch
                                id="method-enabled"
                                checked={form.data.enabled}
                                onCheckedChange={(enabled) => form.setData('enabled', enabled)}
                                disabled={form.processing}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={form.processing} onClick={() => setEditing(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save payment method'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {dialog}
        </BillingSettingsWorkspace>
    );
}
