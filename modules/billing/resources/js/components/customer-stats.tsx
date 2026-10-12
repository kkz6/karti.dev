import { StatSummary } from '@shared/components/stat-summary';
import { Banknote, Clock3, Receipt, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { CustomerFinancials } from '../payment-types';
import { formatAmount } from './billing-dashboard-summary';
import { BillingSelect, BillingSelectItem } from './billing-select';

export function CustomerStats({ financials, defaultCurrency }: { financials: CustomerFinancials; defaultCurrency?: string | null }) {
    const currencies = [...new Set([...financials.totals.map((total) => total.currency), ...financials.invoices.map((invoice) => invoice.currency)])];
    const [selected, setSelected] = useState(defaultCurrency ?? '');
    const currency = currencies.includes(selected) ? selected : (currencies[0] ?? defaultCurrency ?? 'INR');
    const total = financials.totals.find((total) => total.currency === currency);
    const invoices = financials.invoices.filter((invoice) => invoice.currency === currency);
    const issued = invoices.filter((invoice) => invoice.status === 'issued');
    const outstanding = issued.filter((invoice) => invoice.settlement.can_receive).length;
    const overdue = issued.filter((invoice) => invoice.settlement.overdue).length;
    const amount = (value?: string) => formatAmount(value ?? '0');
    return (
        <section aria-label="Customer billing overview" className="mb-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">
                    {financials.invoices.length} invoices · {financials.invoices.filter((invoice) => invoice.status === 'draft').length} drafts ·
                    Totals exclude cancellations
                </p>
                {currencies.length > 1 && (
                    <div className="w-28">
                        <BillingSelect aria-label="Customer summary currency" value={currency} onValueChange={setSelected}>
                            {currencies.map((code) => (
                                <BillingSelectItem key={code} value={code}>
                                    {code}
                                </BillingSelectItem>
                            ))}
                        </BillingSelect>
                    </div>
                )}
            </div>
            <StatSummary
                items={[
                    {
                        label: 'Total invoiced',
                        value: amount(total?.invoiced),
                        currency,
                        icon: Receipt,
                        description: `${issued.length} issued invoices`,
                    },
                    {
                        label: 'Collected',
                        value: amount(total?.paid),
                        currency,
                        icon: Banknote,
                        description: 'Payments received · excludes reversals',
                    },
                    {
                        label: 'Outstanding',
                        value: amount(total?.balance),
                        currency,
                        icon: Clock3,
                        description: `${outstanding} awaiting payment · after credits`,
                    },
                    {
                        label: 'Overdue',
                        value: amount(total?.overdue),
                        currency,
                        icon: TriangleAlert,
                        emphasis: overdue > 0,
                        description: `${overdue} past due`,
                    },
                ]}
            />
        </section>
    );
}
