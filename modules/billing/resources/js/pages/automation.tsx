import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { BillingFeedback } from '../components/billing-feedback';
export default function Automation({
    settings,
    canUpdate,
}: {
    settings: {
        reminders_enabled: boolean;
        reminder_offsets: number[];
        reminder_email: boolean;
        reminder_sms: boolean;
        receipt_email: boolean;
        receipt_sms: boolean;
    };
    canUpdate: boolean;
    message?: string;
}) {
    const form = useForm({ ...settings, reminder_offsets: settings.reminder_offsets.join(', ') });
    return (
        <BillingSettingsWorkspace section="automation">
            <Card>
                <CardHeader>
                    <CardTitle>Reminders & receipts</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.transform((data) => ({
                                ...data,
                                reminder_offsets: data.reminder_offsets
                                    .split(',')
                                    .filter((value) => value.trim() !== '')
                                    .map((value) => Number(value.trim())),
                            }));
                            form.put(route('admin.billing.automation.update'));
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="reminders-enabled"
                                checked={form.data.reminders_enabled}
                                onCheckedChange={(value) => form.setData('reminders_enabled', value === true)}
                                disabled={!canUpdate || form.processing}
                            />
                            <Label htmlFor="reminders-enabled">Enable scheduled reminders</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reminder-offsets">Days relative to due date</Label>
                            <Input
                                id="reminder-offsets"
                                value={form.data.reminder_offsets}
                                onChange={(e) => form.setData('reminder_offsets', e.target.value)}
                                disabled={!canUpdate || form.processing}
                            />
                            <p className="text-muted-foreground text-sm">
                                Comma-separated days. -3 is three days before the due date; 0 is the due date; 3 is three days overdue. Messages are
                                sent to each customer’s billing contacts.
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-3 rounded-lg border p-4">
                                <h3 className="text-sm font-medium">Reminder channels</h3>
                                {(['reminder_email', 'reminder_sms'] as const).map((key) => (
                                    <div className="flex items-center gap-2" key={key}>
                                        <Checkbox
                                            id={key}
                                            checked={form.data[key]}
                                            disabled={!canUpdate || form.processing}
                                            onCheckedChange={(value) => form.setData(key, value === true)}
                                        />
                                        <Label htmlFor={key}>{key.endsWith('sms') ? 'SMS' : 'Email'}</Label>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3 rounded-lg border p-4">
                                <h3 className="text-sm font-medium">Payment received notices</h3>
                                {(['receipt_email', 'receipt_sms'] as const).map((key) => (
                                    <div className="flex items-center gap-2" key={key}>
                                        <Checkbox
                                            id={key}
                                            checked={form.data[key]}
                                            disabled={!canUpdate || form.processing}
                                            onCheckedChange={(value) => form.setData(key, value === true)}
                                        />
                                        <Label htmlFor={key}>{key.endsWith('sms') ? 'SMS' : 'Email'}</Label>
                                    </div>
                                ))}
                                <p className="text-muted-foreground text-xs">
                                    Applies to new manual and verified online payments. Historical imports never send notices.
                                </p>
                            </div>
                        </div>
                        {Object.values(form.errors).length > 0 && (
                            <BillingFeedback kind="error">
                                {Object.values(form.errors).map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </BillingFeedback>
                        )}
                        {canUpdate && (
                            <Button type="submit" disabled={form.processing}>
                                Save automation settings
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>
        </BillingSettingsWorkspace>
    );
}
