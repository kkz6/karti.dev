import { Head, Link, useForm } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Repeat2 as BillingPageIcon } from 'lucide-react';
import { BillingFormCanvas, BillingFormFrame, useBillingModalForm } from '../../components/billing-create-modal';
import { BillingFeedback } from '../../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../../components/billing-select';
import type { RecurringSchedule } from './index';
export default function RecurringForm({
    schedule,
    sources,
    timezones,
    defaultTimezone,
    canUpdate,
    occurrences,
    message,
}: {
    schedule: RecurringSchedule | null;
    sources: { id: number; formatted_number: string | null; customer_name: string }[];
    timezones: string[];
    defaultTimezone: string;
    canUpdate: boolean;
    occurrences: { id: number; scheduled_date: string; invoice_id: number | null; state: string; error: string | null }[];
    message?: string;
}) {
    const form = useForm({
        name: schedule?.name ?? '',
        source_invoice_id: String(schedule?.source_invoice_id ?? ''),
        interval: schedule?.interval ?? 'month',
        every: String(schedule?.every ?? 1),
        timezone: schedule?.timezone ?? defaultTimezone,
        anchor_date: schedule?.anchor_date?.slice(0, 10) ?? '',
        due_days: String(schedule?.due_days ?? 30),
        cycle_limit: schedule?.cycle_limit ? String(schedule.cycle_limit) : '',
        policy: schedule?.policy ?? 'draft',
        active: schedule?.active ?? false,
        version: schedule?.version ?? null,
    });
    const modal = useBillingModalForm(form);
    const Panel = modal ? 'div' : Card,
        Content = modal ? 'div' : CardContent;
    const locked = !!schedule && schedule.cycles_done > 0;
    return (
        <BillingFormFrame breadcrumbs={[{ title: 'Recurring invoices', href: route('admin.recurring-invoices.index') }]}>
            {!modal && <Head title={schedule?.name ?? 'Create schedule'} />}
            <BillingFormCanvas className="max-w-4xl space-y-6">
                {!modal && <IndexHeader title={schedule ? 'Edit recurring schedule' : 'Create recurring schedule'} icon={BillingPageIcon} />}
                {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
                {schedule?.last_error && <BillingFeedback kind="error">{schedule.last_error}</BillingFeedback>}
                <Panel>
                    <Content className={modal ? undefined : 'pt-6'}>
                        <form
                            className="space-y-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (schedule) form.put(route('admin.recurring-invoices.update', schedule.id));
                                else form.post(route('admin.recurring-invoices.store'), modal?.visitOptions);
                            }}
                        >
                            {Object.values(form.errors).length > 0 && (
                                <BillingFeedback kind="error">
                                    {Object.values(form.errors).map((error, i) => (
                                        <p key={i}>{error}</p>
                                    ))}
                                </BillingFeedback>
                            )}
                            <fieldset disabled={!canUpdate || form.processing} className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-name">Schedule name</Label>
                                    <Input
                                        id="recurring-name"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-source">Invoice template</Label>
                                    <BillingSelect
                                        id="recurring-source"
                                        value={form.data.source_invoice_id}
                                        onValueChange={(v) => form.setData('source_invoice_id', v)}
                                        disabled={locked}
                                    >
                                        {sources.map((s) => (
                                            <BillingSelectItem key={s.id} value={s.id}>
                                                {s.formatted_number ?? `Draft #${s.id}`} - {s.customer_name}
                                            </BillingSelectItem>
                                        ))}
                                    </BillingSelect>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-interval">Interval</Label>
                                    <BillingSelect
                                        id="recurring-interval"
                                        value={form.data.interval}
                                        onValueChange={(v) => form.setData('interval', v)}
                                        disabled={locked}
                                    >
                                        {['day', 'week', 'month', 'year'].map((v) => (
                                            <BillingSelectItem key={v} value={v}>
                                                {v}
                                            </BillingSelectItem>
                                        ))}
                                    </BillingSelect>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-every">Every</Label>
                                    <Input
                                        id="recurring-every"
                                        type="number"
                                        min={1}
                                        max={24}
                                        value={form.data.every}
                                        onChange={(e) => form.setData('every', e.target.value)}
                                        disabled={locked}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-first">First invoice date</Label>
                                    <DateField
                                        id="recurring-first"
                                        label="First invoice date"
                                        value={form.data.anchor_date}
                                        onChange={(v) => form.setData('anchor_date', v)}
                                        disabled={locked}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-timezone">Timezone</Label>
                                    <BillingSelect
                                        id="recurring-timezone"
                                        value={form.data.timezone}
                                        onValueChange={(v) => form.setData('timezone', v)}
                                        disabled={locked}
                                    >
                                        {timezones.map((v) => (
                                            <BillingSelectItem key={v} value={v}>
                                                {v}
                                            </BillingSelectItem>
                                        ))}
                                    </BillingSelect>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-due">Due after days</Label>
                                    <Input
                                        id="recurring-due"
                                        type="number"
                                        min={0}
                                        max={365}
                                        value={form.data.due_days}
                                        onChange={(e) => form.setData('due_days', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-limit">Number of cycles</Label>
                                    <Input
                                        id="recurring-limit"
                                        type="number"
                                        min={1}
                                        max={1200}
                                        placeholder="Unlimited"
                                        value={form.data.cycle_limit}
                                        onChange={(e) => form.setData('cycle_limit', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-policy">Generation policy</Label>
                                    <BillingSelect id="recurring-policy" value={form.data.policy} onValueChange={(v) => form.setData('policy', v)}>
                                        <BillingSelectItem value="draft">Create drafts</BillingSelectItem>
                                        <BillingSelectItem value="issue">Issue automatically</BillingSelectItem>
                                        <BillingSelectItem value="issue_and_send">Issue and email automatically</BillingSelectItem>
                                    </BillingSelect>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="recurring-active"
                                        checked={form.data.active}
                                        onCheckedChange={(v) => form.setData('active', v === true)}
                                    />
                                    <Label htmlFor="recurring-active">Schedule active</Label>
                                </div>
                            </fieldset>
                            <p className="text-muted-foreground text-sm">
                                Prices and taxes are copied from the template. Automatic issuance uses current customer/company details. Timing and
                                template stay locked after generation.
                            </p>
                            {canUpdate && (
                                <Button type="submit" disabled={form.processing}>
                                    Save schedule
                                </Button>
                            )}
                        </form>
                    </Content>
                </Panel>
                <Panel>
                    <CardHeader>
                        <CardTitle>Generation history</CardTitle>
                    </CardHeader>
                    <Content>
                        <ol className="divide-y">
                            {occurrences.map((o) => (
                                <li key={o.id} className="py-3 text-sm">
                                    {o.scheduled_date} - {o.state}
                                    {o.invoice_id && (
                                        <>
                                            {' '}
                                            ·{' '}
                                            <Link className="underline" href={route('admin.invoices.show', o.invoice_id)}>
                                                Invoice #{o.invoice_id}
                                            </Link>
                                        </>
                                    )}
                                    {o.error && <p className="text-destructive">{o.error}</p>}
                                </li>
                            ))}
                        </ol>
                    </Content>
                </Panel>
            </BillingFormCanvas>
        </BillingFormFrame>
    );
}
