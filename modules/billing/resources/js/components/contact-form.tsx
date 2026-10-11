import { useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { continueWithoutUnsavedChangesPrompt, UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { useEffect, type FormEvent } from 'react';
import type { Contact } from '../types';
import { useBillingConfirm } from './use-billing-confirm';

export function ContactForm({
    customerId,
    contact,
    onClose,
    embedded = false,
    onStateChange,
}: {
    customerId: number;
    contact?: Contact;
    onClose: () => void;
    embedded?: boolean;
    onStateChange?: (dirty: boolean, busy: boolean) => void;
}) {
    const { confirm, dialog } = useBillingConfirm();

    const form = useForm({
        name: contact?.name ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        title: contact?.title ?? '',
        is_primary: contact?.is_primary ?? false,
        invoice_emails: contact?.invoice_emails ?? true,
    });
    useEffect(() => onStateChange?.(form.isDirty, form.processing), [onStateChange, form.isDirty, form.processing]);
    const Panel = embedded ? 'div' : Card;
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        };
        continueWithoutUnsavedChangesPrompt(() =>
            contact
                ? form.patch(route('admin.customers.contacts.update', [customerId, contact.id]), options)
                : form.post(route('admin.customers.contacts.store', customerId), options),
        );
    };
    return (
        <Panel className={embedded ? undefined : 'bg-muted/20 p-5'}>
            <form onSubmit={submit} className="space-y-5">
                {dialog}
                <UnsavedChangesGuard dirty={form.isDirty && !form.processing} />
                {!embedded && <h3 className="font-semibold">{contact ? 'Edit contact' : 'Add contact'}</h3>}
                <div className="grid gap-4 sm:grid-cols-2">
                    {(['name', 'email', 'phone', 'title'] as const).map((field) => (
                        <div key={field} className="space-y-2">
                            <Label htmlFor={`contact-${field}`}>
                                {field === 'title' ? 'Role or job title' : field === 'name' ? 'Name *' : field === 'email' ? 'Email *' : 'Phone'}
                            </Label>
                            <Input
                                id={`contact-${field}`}
                                type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                                value={form.data[field]}
                                onChange={(e) => form.setData(field, e.target.value)}
                                required={field === 'name' || field === 'email'}
                                aria-invalid={!!form.errors[field]}
                            />
                            {form.errors[field] && <p className="text-destructive text-sm">{form.errors[field]}</p>}
                        </div>
                    ))}
                </div>
                <div className="space-y-3">
                    {(['is_primary', 'invoice_emails'] as const).map((field) => (
                        <div key={field}>
                            <Label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={form.data[field]} onCheckedChange={(checked) => form.setData(field, checked === true)} />
                                {field === 'is_primary' ? 'Primary billing contact' : 'Receive invoice emails'}
                            </Label>
                            {form.errors[field] && <p className="text-destructive text-sm">{form.errors[field]}</p>}
                        </div>
                    ))}
                    <p className="text-muted-foreground text-xs">
                        The first active contact becomes primary automatically. Choosing a new primary contact replaces the previous one.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Saving…' : 'Save contact'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                            if (!form.isDirty || (await confirm('Discard unsaved contact changes?'))) onClose();
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Panel>
    );
}
