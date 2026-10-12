import { Head, Link, useForm } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { PageContainer } from '@shared/components/page-container';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { statusTone } from '@shared/lib/status-colors';
import { cn } from '@shared/lib/utils';
import { CalendarClock, History, Lock, Repeat2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { BillingFormFrame, useBillingModalForm } from '../../components/billing-create-modal';
import { BillingFeedback } from '../../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../../components/billing-select';
import { AsideCard, Detail, DetailHeader } from '../../components/detail-page';
import type { RecurringSchedule } from './index';

type Occurrence = { id: number; scheduled_date: string; invoice_id: number | null; state: string; error: string | null };

const intervals = [
    { value: 'day', label: 'Day(s)' },
    { value: 'week', label: 'Week(s)' },
    { value: 'month', label: 'Month(s)' },
    { value: 'year', label: 'Year(s)' },
];
const policies = [
    { value: 'draft', label: 'Create drafts', hint: 'Each cycle creates a draft for you to review and issue.' },
    { value: 'issue', label: 'Issue automatically', hint: 'Each cycle issues a numbered invoice without review.' },
    { value: 'issue_and_send', label: 'Issue and email automatically', hint: 'Each cycle issues the invoice and emails it to the customer.' },
];

export default function RecurringForm({
    schedule,
    sources,
    timezones,
    defaultTimezone,
    canUpdate,
    occurrences,
}: {
    schedule: RecurringSchedule | null;
    sources: { id: number; formatted_number: string | null; customer_name: string }[];
    timezones: string[];
    defaultTimezone: string;
    canUpdate: boolean;
    occurrences: Occurrence[];
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
    const locked = !!schedule && schedule.cycles_done > 0;
    const formId = schedule ? `recurring-form-${schedule.id}` : 'recurring-form-new';
    const source = sources.find((s) => String(s.id) === form.data.source_invoice_id);
    const cadence = `Every ${form.data.every || 1} ${form.data.interval}${Number(form.data.every) === 1 ? '' : 's'}`;
    const submit = () => {
        if (schedule) form.put(route('admin.recurring-invoices.update', schedule.id), { preserveScroll: true });
        else form.post(route('admin.recurring-invoices.store'), modal?.visitOptions);
    };

    const fields = (
        <form
            id={formId}
            className="space-y-8"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            {Object.values(form.errors).length > 0 && (
                <BillingFeedback kind="error">
                    {Object.values(form.errors).map((error, i) => (
                        <p key={i}>{error}</p>
                    ))}
                </BillingFeedback>
            )}
            <fieldset disabled={!canUpdate || form.processing} className="space-y-8">
                <Section title="Template" description="The invoice whose customer, items, prices and taxes are copied each cycle.">
                    <Field label="Schedule name" htmlFor="recurring-name">
                        <Input
                            id="recurring-name"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="e.g. Monthly retainer — Acme"
                            required
                        />
                    </Field>
                    <Field label="Invoice template" htmlFor="recurring-source" locked={locked}>
                        <BillingSelect
                            id="recurring-source"
                            value={form.data.source_invoice_id}
                            onValueChange={(v) => form.setData('source_invoice_id', v)}
                            disabled={locked}
                        >
                            {sources.map((s) => (
                                <BillingSelectItem key={s.id} value={s.id}>
                                    {s.formatted_number ?? `Draft #${s.id}`} — {s.customer_name}
                                </BillingSelectItem>
                            ))}
                        </BillingSelect>
                    </Field>
                </Section>

                <Section title="Schedule" description="When invoices are generated. Timing locks once the first cycle has run.">
                    <Field label="Repeat every" htmlFor="recurring-every" locked={locked}>
                        <div className="flex gap-2">
                            <Input
                                id="recurring-every"
                                type="number"
                                min={1}
                                max={24}
                                className="w-20 shrink-0 tabular-nums"
                                value={form.data.every}
                                onChange={(e) => form.setData('every', e.target.value)}
                                disabled={locked}
                                required
                            />
                            <div className="min-w-0 flex-1">
                                <BillingSelect
                                    id="recurring-interval"
                                    aria-label="Interval"
                                    value={form.data.interval}
                                    onValueChange={(v) => form.setData('interval', v)}
                                    disabled={locked}
                                >
                                    {intervals.map((v) => (
                                        <BillingSelectItem key={v.value} value={v.value}>
                                            {v.label}
                                        </BillingSelectItem>
                                    ))}
                                </BillingSelect>
                            </div>
                        </div>
                    </Field>
                    <Field label="First invoice date" htmlFor="recurring-first" locked={locked}>
                        <DateField
                            id="recurring-first"
                            label="First invoice date"
                            value={form.data.anchor_date}
                            onChange={(v) => form.setData('anchor_date', v)}
                            disabled={locked}
                        />
                    </Field>
                    <Field label="Timezone" htmlFor="recurring-timezone" locked={locked} className="sm:col-span-2">
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
                    </Field>
                </Section>

                <Section title="Generated invoices" description="Payment terms and what happens to each generated invoice.">
                    <Field label="Due after" htmlFor="recurring-due" hint="Days after the invoice date.">
                        <Input
                            id="recurring-due"
                            type="number"
                            min={0}
                            max={365}
                            className="tabular-nums"
                            value={form.data.due_days}
                            onChange={(e) => form.setData('due_days', e.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Number of cycles" htmlFor="recurring-limit" hint="Leave empty to repeat until stopped.">
                        <Input
                            id="recurring-limit"
                            type="number"
                            min={1}
                            max={1200}
                            className="tabular-nums"
                            placeholder="Unlimited"
                            value={form.data.cycle_limit}
                            onChange={(e) => form.setData('cycle_limit', e.target.value)}
                        />
                    </Field>
                    <Field
                        label="Generation policy"
                        htmlFor="recurring-policy"
                        hint={policies.find((p) => p.value === form.data.policy)?.hint}
                        className="sm:col-span-2"
                    >
                        <BillingSelect id="recurring-policy" value={form.data.policy} onValueChange={(v) => form.setData('policy', v)}>
                            {policies.map((p) => (
                                <BillingSelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </BillingSelectItem>
                            ))}
                        </BillingSelect>
                    </Field>
                </Section>

                {modal && <ActiveToggle checked={form.data.active} onChange={(v) => form.setData('active', v)} />}
            </fieldset>
        </form>
    );

    if (modal) {
        return (
            <div className="space-y-5">
                {fields}
                {canUpdate && (
                    <div className="bg-background sticky -bottom-5 -mx-5 -mb-5 flex justify-end gap-2 border-t px-5 py-4">
                        <Button type="button" variant="outline" onClick={() => void modal.requestClose()} disabled={form.processing}>
                            Cancel
                        </Button>
                        <Button type="submit" form={formId} disabled={form.processing}>
                            {form.processing ? 'Creating…' : 'Create schedule'}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    const title = schedule?.name || 'Create recurring schedule';
    const statusBadge = schedule && (
        <Badge variant={statusTone(schedule.active ? 'active' : 'paused')}>{schedule.active ? 'Active' : 'Paused'}</Badge>
    );
    const saveButton = (size: 'sm' | 'default') =>
        canUpdate && (
            <Button type="submit" form={formId} size={size} disabled={form.processing}>
                {form.processing ? 'Saving…' : 'Save schedule'}
            </Button>
        );
    const limit = schedule?.cycle_limit ?? null;

    return (
        <BillingFormFrame breadcrumbs={[{ title: 'Recurring invoices', href: route('admin.recurring-invoices.index') }]}>
            <Head title={title} />

            <PageContainer className="content-editor">
                <DetailHeader
                    stickyMeta={schedule && <span className="text-muted-foreground">Next {schedule.next_date?.slice(0, 10) ?? '—'}</span>}
                    stickyActions={saveButton('sm')}
                    title={title}
                    badges={statusBadge}
                    subtitle={[cadence, source?.customer_name].filter(Boolean).join(' · ')}
                    actions={saveButton('default')}
                />
                <div className="space-y-4 empty:hidden">
                    {schedule?.last_error && (
                        <BillingFeedback kind="error" title="Last run failed">
                            {schedule.last_error}
                        </BillingFeedback>
                    )}
                </div>
                <div className="content-editor-grid">
                    <div className="content-editor-main">
                        <div className="content-editor-panel">{fields}</div>
                    </div>
                    <aside className="content-editor-aside" aria-label="Schedule summary">
                        <ActiveToggle
                            checked={form.data.active}
                            onChange={(v) => form.setData('active', v)}
                            disabled={!canUpdate || form.processing}
                        />
                        {schedule && (
                            <AsideCard title="Progress" icon={CalendarClock}>
                                <div>
                                    <p className="text-muted-foreground text-xs">Next invoice</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                                        {schedule.next_date?.slice(0, 10) ?? '—'}
                                    </p>
                                    {limit !== null && (
                                        <div
                                            className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full"
                                            role="progressbar"
                                            aria-label="Cycles completed"
                                            aria-valuemin={0}
                                            aria-valuemax={limit}
                                            aria-valuenow={schedule.cycles_done}
                                        >
                                            <div
                                                className="h-full rounded-full bg-emerald-500"
                                                style={{ width: `${Math.min(100, (schedule.cycles_done / limit) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <dl className="space-y-2 border-t pt-3 text-sm">
                                    <Detail label="Cycles run">
                                        {schedule.cycles_done}
                                        {limit !== null && ` of ${limit}`}
                                    </Detail>
                                    <Detail label="Cadence">{cadence}</Detail>
                                    <Detail label="Started">{schedule.anchor_date?.slice(0, 10)}</Detail>
                                    {source && (
                                        <Detail label="Template">
                                            <Link href={route('admin.invoices.show', source.id)} className="font-medium hover:underline">
                                                {source.formatted_number ?? `Draft #${source.id}`}
                                            </Link>
                                        </Detail>
                                    )}
                                </dl>
                            </AsideCard>
                        )}
                        {schedule && (
                            <AsideCard title="Generation history" icon={History} description="The last 100 scheduled runs.">
                                {occurrences.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No invoices generated yet.</p>
                                ) : (
                                    <ol className="-mx-1 divide-y text-sm">
                                        {occurrences.map((o) => (
                                            <li key={o.id} className="px-1 py-2.5 first:pt-0 last:pb-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="tabular-nums">{o.scheduled_date.slice(0, 10)}</span>
                                                    {o.invoice_id ? (
                                                        <Link
                                                            className="font-medium hover:underline"
                                                            href={route('admin.invoices.show', o.invoice_id)}
                                                        >
                                                            Invoice #{o.invoice_id}
                                                        </Link>
                                                    ) : (
                                                        <Badge variant={statusTone(o.state)}>{o.state}</Badge>
                                                    )}
                                                </div>
                                                {o.error && <p className="text-destructive mt-1 text-xs break-words">{o.error}</p>}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </AsideCard>
                        )}
                        <p className="text-muted-foreground flex gap-2 text-xs leading-relaxed">
                            <Repeat2 className="mt-0.5 size-3.5 shrink-0" />
                            Prices and taxes come from the template. Automatic issuance uses current customer and company details.
                        </p>
                    </aside>
                </div>
            </PageContainer>
        </BillingFormFrame>
    );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
                <p className="text-muted-foreground mt-1 text-xs">{description}</p>
            </div>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function Field({
    label,
    htmlFor,
    hint,
    locked,
    className,
    children,
}: {
    label: string;
    htmlFor: string;
    hint?: string;
    locked?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('min-w-0 space-y-2', className)}>
            <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
                {label}
                {locked && <Lock className="text-muted-foreground size-3" aria-label="Locked after first run" />}
            </Label>
            {children}
            {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
    );
}

function ActiveToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
    return (
        <div className="bg-muted flex items-center justify-between gap-4 rounded-xl px-5 py-4">
            <div>
                <Label htmlFor="recurring-active" className="text-sm font-medium">
                    Schedule active
                </Label>
                <p className="text-muted-foreground mt-0.5 text-xs">
                    {checked ? 'Invoices generate on schedule.' : 'Paused — nothing is generated.'}
                </p>
            </div>
            <Switch id="recurring-active" checked={checked} onCheckedChange={onChange} disabled={disabled} />
        </div>
    );
}
