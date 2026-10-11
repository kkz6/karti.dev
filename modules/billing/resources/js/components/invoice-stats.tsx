import { StatSummary } from '@shared/components/stat-summary';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Banknote, Clock3, FilePenLine, Receipt, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { formatAmount, type BillingDashboardData } from './billing-dashboard-summary';

export type InvoiceSummaryData = Omit<BillingDashboardData, 'currencies'> & {
    currencies: Array<
        BillingDashboardData['currencies'][number] & {
            paid: string;
            drafts: string;
            counts: BillingDashboardData['counts'];
        }
    >;
};

export function InvoiceStats({ data }: { data: InvoiceSummaryData }) {
    const [currencyKey, setCurrencyKey] = useState('');
    const key = (row: InvoiceSummaryData['currencies'][number]) => `${row.currency}-${row.precision}`;
    const row = data.currencies.find((entry) => key(entry) === currencyKey) ?? data.currencies[0];
    const amount = (value?: string) => (value === undefined ? '0' : formatAmount(value));
    const counts = row?.counts ?? { issued: 0, drafts: 0, outstanding: 0, overdue: 0 };
    return (
        <section aria-label="Invoice overview" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">All invoices · All time · Totals exclude cancellations</p>
                {data.currencies.length > 1 && (
                    <Select value={row ? key(row) : ''} onValueChange={setCurrencyKey}>
                        <SelectTrigger aria-label="Invoice summary currency" className="h-8 w-auto min-w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {data.currencies.map((entry) => (
                                <SelectItem key={key(entry)} value={key(entry)}>
                                    {entry.currency}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <StatSummary
                items={[
                    {
                        label: 'Total invoiced',
                        value: amount(row?.invoiced),
                        currency: row?.currency,
                        icon: Receipt,
                        description: `${counts.issued} issued invoices`,
                    },
                    {
                        label: 'Pending payment',
                        value: amount(row?.outstanding),
                        currency: row?.currency,
                        icon: Clock3,
                        description: `${counts.outstanding} awaiting payment · after credits`,
                    },
                    {
                        label: 'Overdue',
                        value: amount(row?.overdue),
                        currency: row?.currency,
                        icon: TriangleAlert,
                        emphasis: counts.overdue > 0,
                        description: `${counts.overdue} past due`,
                    },
                    {
                        label: 'Paid',
                        value: amount(row?.paid),
                        currency: row?.currency,
                        icon: Banknote,
                        description: 'Payments received · excludes reversals',
                    },
                    {
                        label: 'Drafts',
                        value: amount(row?.drafts),
                        currency: row?.currency,
                        icon: FilePenLine,
                        description: `${counts.drafts} not yet issued`,
                    },
                ]}
            />
        </section>
    );
}
