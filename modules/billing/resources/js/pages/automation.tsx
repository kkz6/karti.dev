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
    message,
}: {
    settings: { reminders_enabled: boolean; reminder_offsets: number[] };
    canUpdate: boolean;
    message?: string;
}) {
    const form = useForm({ reminders_enabled: settings.reminders_enabled, reminder_offsets: settings.reminder_offsets.join(', ') });
    return (
        <BillingSettingsWorkspace section="automation">
            {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
            <Card className="gap-5 border-0 bg-transparent shadow-none">
                <CardHeader className="px-0 pt-0">
                    <CardTitle>Invoice reminders</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <form
                        className="space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.transform((data) => ({
                                ...data,
                                reminder_offsets: data.reminder_offsets.split(',').map((value) => Number(value.trim())),
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
                            <Label htmlFor="reminder-offsets">Days after due date</Label>
                            <Input
                                id="reminder-offsets"
                                value={form.data.reminder_offsets}
                                onChange={(e) => form.setData('reminder_offsets', e.target.value)}
                                disabled={!canUpdate || form.processing}
                            />
                            <p className="text-muted-foreground text-sm">
                                Comma-separated days. 0 is the due date; 3 is three days overdue. Messages are sent to each customer’s billing
                                contacts.
                            </p>
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
                                Save reminder settings
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>
        </BillingSettingsWorkspace>
    );
}
