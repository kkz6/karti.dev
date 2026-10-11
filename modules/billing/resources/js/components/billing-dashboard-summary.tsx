import { Link } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/components/ui/tooltip';
import { ArrowRight, Info, Plus, Receipt } from 'lucide-react';

export type BillingDashboardData = {
    counts: { issued: number; drafts: number; outstanding: number; overdue: number };
    currencies: Array<{ currency: string; precision: number; invoiced: string; outstanding: string; overdue: string; collected: string }>;
    period: { days: number; from: string; to: string; timezone: string };
};

export function BillingDashboardSummary({ data, canCreate }: { data: BillingDashboardData; canCreate: boolean }) {
    return (
        <section aria-labelledby="billing-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="billing-heading" className="flex items-center gap-2 text-lg font-semibold">
                    <Receipt className="text-muted-foreground size-4" aria-hidden="true" />
                    Billing overview
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label="About billing totals"
                                className="text-muted-foreground hover:text-foreground rounded-sm focus-visible:outline-2"
                            >
                                <Info className="size-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            Invoice totals exclude drafts and cancellations. Outstanding is reduced by payments and applied credits. Collected
                            includes unreversed payments from {data.period.from} to {data.period.to} ({data.period.timezone}). Currencies are kept
                            separate.
                        </TooltipContent>
                    </Tooltip>
                </h2>
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.invoices.index')}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                    >
                        All invoices <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                    {canCreate && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.invoices.create')}>
                                <Plus className="size-4" aria-hidden="true" />
                                Create invoice
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span>
                    <strong className="text-foreground font-medium tabular-nums">{data.counts.issued}</strong> issued
                </span>
                <Link href={route('admin.invoices.index', { view: 'draft' })} className="hover:text-foreground hover:underline">
                    <strong className="text-foreground font-medium tabular-nums">{data.counts.drafts}</strong> drafts
                </Link>
                <span>
                    <strong className="text-foreground font-medium tabular-nums">{data.counts.outstanding}</strong> awaiting payment
                </span>
                <span className={data.counts.overdue ? 'text-amber-700 dark:text-amber-400' : ''}>
                    <strong className="font-medium tabular-nums">{data.counts.overdue}</strong> overdue
                </span>
            </div>
            <div className="overflow-x-auto rounded-lg border">
                {data.currencies.length ? (
                    <table className="w-full min-w-[480px] text-sm">
                        <thead className="text-muted-foreground border-b text-xs">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left font-medium">
                                    Currency
                                </th>
                                <th scope="col" className="px-4 py-2 text-right font-medium">
                                    Invoiced <span className="font-normal">· all time</span>
                                </th>
                                <th scope="col" className="px-4 py-2 text-right font-medium">
                                    Outstanding
                                </th>
                                <th scope="col" className="px-4 py-2 text-right font-medium">
                                    Overdue
                                </th>
                                <th scope="col" className="px-4 py-2 text-right font-medium">
                                    Collected <span className="font-normal">· {data.period.days} days</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.currencies.map((row) => (
                                <tr key={`${row.currency}-${row.precision}`}>
                                    <th scope="row" className="px-4 py-2.5 text-left font-medium">
                                        {row.currency}
                                    </th>
                                    <td className="px-4 py-2.5 text-right tabular-nums">{formatAmount(row.invoiced)}</td>
                                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatAmount(row.outstanding)}</td>
                                    <td
                                        className={`px-4 py-2.5 text-right tabular-nums ${Number(row.overdue) > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
                                    >
                                        {formatAmount(row.overdue)}
                                    </td>
                                    <td
                                        className={`px-4 py-2.5 text-right tabular-nums ${Number(row.collected) > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}
                                    >
                                        {formatAmount(row.collected)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-muted-foreground px-4 py-4 text-sm">No issued invoices or recent payments yet.</p>
                )}
            </div>
        </section>
    );
}

// Group decimal strings without converting monetary totals to floating point.
export function formatAmount(value: string) {
    const [whole, fraction] = value.split('.');
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : `.${fraction}`);
}
