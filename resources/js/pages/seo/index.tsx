import { Head, Link, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { PageContainer } from '@shared/components/page-container';
import { Button } from '@shared/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components/ui/chart';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import AppLayout from '@shared/layouts/app-layout';
import { ArrowLeft, ArrowUpRight, BarChart3, Info } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type Breakdown = { label: string; views: number }[];
type Traffic = {
    views: number;
    dailyVisitors: number;
    enabled: boolean;
    chart: { date: string; views: number; visitors: number }[];
    pages: Breakdown;
    referrers: Breakdown;
    browsers: Breakdown;
    platforms: Breakdown;
    devices: Breakdown;
};

function BreakdownReport({
    title,
    label,
    items,
    pageLinks = false,
    days = 30,
}: {
    title: string;
    label: string;
    items: Breakdown;
    pageLinks?: boolean;
    days?: number;
}) {
    return (
        <section className="min-w-0 space-y-4">
            <h2 className="text-base font-semibold">{title}</h2>
            {items.length ? (
                <table className="w-full table-fixed text-sm">
                    <thead>
                        <tr className="text-muted-foreground border-border/60 border-b text-xs">
                            <th scope="col" className="pb-2 text-left font-normal">
                                {label}
                            </th>
                            <th scope="col" className="w-20 pb-2 text-right font-normal">
                                Views
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border/40 divide-y">
                        {items.map((item) => (
                            <tr key={item.label}>
                                <td className="py-3 pr-4">
                                    {pageLinks ? (
                                        <Link
                                            className="hover:text-primary flex min-w-0 items-center gap-2 hover:underline"
                                            title={item.label}
                                            href={route('admin.seo.page', { path: item.label, period: days === 1 ? '24h' : `${days}d` })}
                                        >
                                            <span className="truncate">{item.label}</span>
                                            <ArrowUpRight aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
                                        </Link>
                                    ) : (
                                        <span className="block truncate" title={item.label}>
                                            {item.label}
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 text-right tabular-nums">{item.views.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-muted-foreground bg-muted/30 rounded-md px-4 py-6 text-sm">No data for this period.</p>
            )}
        </section>
    );
}

const publicPages: Record<string, string> = {
    '/': 'Home',
    '/articles': 'Articles',
    '/photography': 'Photography',
    '/projects': 'Projects',
    '/speaking': 'Speaking',
    '/uses': 'Uses / tools',
    '/about': 'About',
    '/consulting': 'Consulting',
};
const periods: Record<number, string> = { 1: 'Today (UTC)', 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' };
type TrafficScope = { title: string; path?: string; description: string; url: string; backUrl: string };

export default function SeoOverview({ traffic, days, scope }: { traffic: Traffic; days: number; scope?: TrafficScope }) {
    const [updating, setUpdating] = useState(false);
    const [failed, setFailed] = useState(false);
    const selectedPage = scope ? (scope.path ?? 'current-entry') : 'all';
    const scopeTitle = scope?.path ? (publicPages[scope.path] ?? scope.title) : scope?.title;
    const hasCustomScope = scope && !publicPages[selectedPage];
    const visitReport = (url: string, nextDays = days) =>
        router.get(
            url,
            { period: nextDays === 1 ? '24h' : `${nextDays}d` },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => {
                    setUpdating(true);
                    setFailed(false);
                },
                onError: () => setFailed(true),
                onFinish: () => setUpdating(false),
            },
        );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'SEO', href: route('admin.seo.index') },
                { title: 'Local traffic', href: scope?.url || route('admin.seo.index') },
            ]}
        >
            <Head title={scope ? `Analytics · ${scopeTitle}` : 'SEO · Local traffic'} />
            <PageContainer className="content-index space-y-8">
                <div className="space-y-2">
                    <IndexHeader
                        title="Local traffic"
                        icon={BarChart3}
                        actions={
                            <Button asChild variant="outline">
                                <Link href={scope?.backUrl || route('admin.seo.google')}>
                                    {scope ? (
                                        <>
                                            <ArrowLeft className="size-4" />
                                            {scope.path ? 'All traffic' : 'Back to editor'}
                                        </>
                                    ) : (
                                        'Google Analytics'
                                    )}
                                </Link>
                            </Button>
                        }
                    />
                    <p className="text-muted-foreground text-sm">Page views and daily visitor estimates collected on your site.</p>
                </div>

                <section aria-label="Report filters" className="space-y-4">
                    <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                        <div className="min-w-0 space-y-2">
                            <Label htmlFor="analytics-page">Page</Label>
                            <Select
                                value={selectedPage}
                                disabled={updating}
                                onValueChange={(path) => {
                                    if (path !== selectedPage)
                                        visitReport(path === 'all' ? route('admin.seo.index') : route('admin.seo.page', { path }));
                                }}
                            >
                                <SelectTrigger
                                    id="analytics-page"
                                    title={scopeTitle || 'All traffic'}
                                    aria-label="Explore page analytics"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                                    <SelectItem value="all">All traffic</SelectItem>
                                    {hasCustomScope && <SelectItem value={selectedPage}>{scopeTitle}</SelectItem>}
                                    {Object.entries(publicPages).map(([path, label]) => (
                                        <SelectItem key={path} value={path}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="analytics-period">Period</Label>
                            <Select
                                value={String(days)}
                                disabled={updating}
                                onValueChange={(value) => visitReport(scope?.url || route('admin.seo.index'), Number(value))}
                            >
                                <SelectTrigger id="analytics-period" aria-label="Reporting period">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(periods).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {scope && (
                        <div className="space-y-1">
                            <h2 className="font-medium break-words">{scopeTitle}</h2>
                            <p className="text-muted-foreground text-sm">{scope.description}</p>
                        </div>
                    )}
                    <p role="status" className="text-muted-foreground text-sm empty:hidden">
                        {updating ? 'Updating report…' : failed ? 'The report could not be updated. Please try again.' : ''}
                    </p>
                    {!traffic.enabled && (
                        <p role="status" className="bg-muted/50 flex items-start gap-2 rounded-md p-3 text-sm">
                            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            Tracking is disabled. This report shows previously collected data.
                        </p>
                    )}
                </section>

                <div aria-busy={updating} className="space-y-8">
                    <dl className="bg-muted/40 grid gap-6 rounded-lg p-5 sm:grid-cols-2 sm:gap-10 sm:p-6">
                        <div>
                            <dt className="text-muted-foreground text-sm">Page views</dt>
                            <dd className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{traffic.views.toLocaleString()}</dd>
                            <p className="text-muted-foreground mt-2 text-xs">Counted visits · {periods[days]}</p>
                        </div>
                        <div>
                            <dt className="text-muted-foreground text-sm">Daily visitors</dt>
                            <dd className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{traffic.dailyVisitors.toLocaleString()}</dd>
                            <p className="text-muted-foreground mt-2 text-xs">Sum of daily estimates, not unique people across the period.</p>
                        </div>
                    </dl>

                    <section aria-labelledby="traffic-trend" className="space-y-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 id="traffic-trend" className="text-base font-semibold">
                                Views over time
                            </h2>
                            <span className="text-muted-foreground text-xs">Daily totals · UTC</span>
                        </div>
                        {traffic.views ? (
                            <ChartContainer config={{ views: { label: 'Views', color: 'var(--chart-1)' } }} className="h-64 w-full">
                                <BarChart accessibilityLayer data={traffic.chart}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={40}
                                        tickFormatter={(date) =>
                                            new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                timeZone: 'UTC',
                                            })
                                        }
                                    />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="views" fill="var(--color-views)" radius={[3, 3, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="bg-muted/20 flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg px-6 text-center">
                                <BarChart3 aria-hidden="true" className="text-muted-foreground/60 mb-1 size-6" />
                                <p className="text-sm font-medium">No views recorded yet</p>
                                <p className="text-muted-foreground max-w-sm text-sm">
                                    Try another period or page. Visits while signed in are not counted.
                                </p>
                            </div>
                        )}
                    </section>

                    <div className="border-border/60 grid gap-8 border-t pt-6 lg:grid-cols-2 lg:gap-12">
                        <BreakdownReport title={scope ? 'Recorded URLs' : 'Top pages'} label="Page" items={traffic.pages} pageLinks days={days} />
                        <BreakdownReport title="Traffic sources" label="Referrer" items={traffic.referrers} />
                    </div>
                    <div className="border-border/60 grid gap-8 border-t pt-6 md:grid-cols-3">
                        <BreakdownReport title="Browsers" label="Browser" items={traffic.browsers} />
                        <BreakdownReport title="Operating systems" label="System" items={traffic.platforms} />
                        <BreakdownReport title="Devices" label="Device" items={traffic.devices} />
                    </div>
                </div>

                <details className="border-border/60 border-t pt-5 text-sm">
                    <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer">How this traffic is counted</summary>
                    <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">
                        Daily visitors are estimated from hashed IP addresses and reset each UTC day—not distinct people across this period. Same-page
                        refreshes within a one-minute bucket count once. Signed-in users, detected bots, prefetches and privacy opt-outs are excluded.
                        Records are retained for 90 days.
                    </p>
                </details>
            </PageContainer>
        </AppLayout>
    );
}
