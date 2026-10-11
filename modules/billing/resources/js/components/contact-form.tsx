import { useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { PhoneInput } from '@shared/components/ui/phone-input';
import { Switch } from '@shared/components/ui/switch';
import { continueWithoutUnsavedChangesPrompt, UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { useEffect, type FormEvent } from 'react';
import type { Contact } from '../types';
import { useBillingConfirm } from './use-billing-confirm';

export function ContactForm({
    customerId,
    contact,
    defaultCountry,
    onClose,
    embedded = false,
    onStateChange,
}: {
    customerId: number;
    contact?: Contact;
    defaultCountry?: string | null;
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
                <div className="grid gap-4">
                    {(
                        [
                            ['name', 'Name', 'text', 'name'],
                            ['email', 'Email', 'email', 'email'],
                            ['phone', 'Phone', 'tel', 'tel'],
                            ['title', 'Role or job title', 'text', 'organization-title'],
                        ] as const
                    ).map(([field, label, type, autoComplete]) => (
                        <div key={field} className="space-y-2">
                            <Label htmlFor={`contact-${field}`}>
                                {label}
                                {(field === 'name' || field === 'email') && <span className="text-muted-foreground ml-0.5">*</span>}
                            </Label>
                            {field === 'phone' ? (
                                <PhoneInput
                                    id="contact-phone"
                                    defaultCountry={defaultCountry}
                                    value={form.data.phone}
                                    onChange={(value) => form.setData('phone', value)}
                                    disabled={form.processing}
                                    aria-invalid={!!form.errors.phone}
                                />
                            ) : (
                                <Input
                                    id={`contact-${field}`}
                                    type={type}
                                    autoComplete={autoComplete}
                                    placeholder={field === 'title' ? 'e.g. Finance manager' : undefined}
                                    value={form.data[field]}
                                    onChange={(e) => form.setData(field, e.target.value)}
                                    required={field === 'name' || field === 'email'}
                                    aria-invalid={!!form.errors[field]}
                                />
                            )}
                            {form.errors[field] && <p className="text-destructive text-sm">{form.errors[field]}</p>}
                        </div>
                    ))}
                </div>
                <div className="divide-y rounded-lg border">
                    {(
                        [
                            ['is_primary', 'Primary billing contact', 'Default recipient for invoices. Replaces the current primary contact.'],
                            [
                                'invoice_emails',
                                'Receive billing notifications',
                                'Receive invoice emails, reminders and SMS notices through enabled channels.',
                            ],
                        ] as const
                    ).map(([field, label, hint]) => (
                        <div key={field} className="flex items-center justify-between gap-4 px-4 py-3">
                            <div>
                                <Label htmlFor={`contact-${field}`} className="text-sm font-medium">
                                    {label}
                                </Label>
                                <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
                                {form.errors[field] && <p className="text-destructive mt-1 text-sm">{form.errors[field]}</p>}
                            </div>
                            <Switch id={`contact-${field}`} checked={form.data[field]} onCheckedChange={(checked) => form.setData(field, checked)} />
                        </div>
                    ))}
                </div>
                <div className={embedded ? '-mx-6 -mb-6 flex justify-end gap-2 border-t px-6 py-4' : 'flex justify-end gap-2'}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                            if (!form.isDirty || (await confirm('Discard unsaved contact changes?'))) onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Saving…' : contact ? 'Save changes' : 'Add contact'}
                    </Button>
                </div>
            </form>
        </Panel>
    );
}
