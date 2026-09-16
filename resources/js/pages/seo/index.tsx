import { Head, Link, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import AppLayout from '@shared/layouts/app-layout';
import { ArrowLeft, Search } from 'lucide-react';
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

function BreakdownCard({ title, items, pageLinks = false, days = 30 }: { title: string; items: Breakdown; pageLinks?: boolean; days?: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length ? (
                    <ul className="divide-y">
                        {items.map((item) => (
                            <li key={item.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                                {pageLinks ? (
                                    <Link
                                        className="min-w-0 truncate hover:underline"
                                        title={item.label}
                                        href={route('admin.seo.page', { path: item.label, period: days === 1 ? '24h' : `${days}d` })}
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="min-w-0 truncate" title={item.label}>
                                        {item.label}
                                    </span>
                                )}
                                <span className="text-muted-foreground tabular-nums">{item.views.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-sm">No recorded views in this period.</p>
                )}
            </CardContent>
        </Card>
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

type TrafficScope = { title: string; path?: string; description: string; url: string; backUrl: string };

export default function SeoOverview({ traffic, days, scope }: { traffic: Traffic; days: number; scope?: TrafficScope }) {
    const selectedPage = scope ? (scope.path ?? 'current-entry') : 'all';
    const scopeTitle = scope?.path ? (publicPages[scope.path] ?? scope.title) : scope?.title;
    const hasCustomScope = scope && !publicPages[selectedPage];

    return (
        <AppLayout breadcrumbs={[{ title: 'SEO', href: route('admin.seo.index') }]}>
            <Head title={scope ? `Analytics · ${scopeTitle}` : 'SEO · Local traffic'} />
            <div className="content-index space-y-6">
                <IndexHeader
                    title={scopeTitle || 'SEO'}
                    icon={Search}
                    actions={
                        <Button asChild variant="outline">
                            <Link href={scope?.backUrl || route('admin.seo.google')}>
                                {scope ? (
                                    <>
                                        <ArrowLeft className="size-4" />
                                        Back
                                    </>
                                ) : (
                                    'Google Analytics'
                                )}
                            </Link>
                        </Button>
                    }
                />
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold">Local traffic</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {scope?.description || 'First-party page views, without a Google API call.'}
                        </p>
                    </div>
                    <Select
                        value={String(days)}
                        onValueChange={(value) =>
                            router.get(
                                scope?.url || route('admin.seo.index'),
                                { period: value === '1' ? '24h' : `${value}d` },
                                { preserveScroll: true },
                            )
                        }
                    >
                        <SelectTrigger aria-label="Reporting period" className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[
                                [1, 'Today (UTC)'],
                                [7, 'Last 7 days'],
                                [30, 'Last 30 days'],
                                [90, 'Last 90 days'],
                            ].map(([value, label]) => (
                                <SelectItem key={value} value={String(value)}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={selectedPage}
                        onValueChange={(path) =>
                            router.get(path === 'all' ? route('admin.seo.index') : route('admin.seo.page', { path }), {
                                period: days === 1 ? '24h' : `${days}d`,
                            })
                        }
                    >
                        <SelectTrigger aria-label="Explore page analytics" className="w-56">
                            <SelectValue placeholder="Explore a page…" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All traffic</SelectItem>
                            {hasCustomScope && (
                                <SelectItem value={selectedPage} disabled={!scope.path}>
                                    {scopeTitle}
                                </SelectItem>
                            )}
                            {Object.entries(publicPages).map(([path, label]) => (
                                <SelectItem key={path} value={path}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">Individual articles and galleries also have analytics in their editors.</p>
                </div>
                {!traffic.enabled && (
                    <p role="status" className="rounded-md border p-3 text-sm">
                        Local tracking is disabled. Previously collected data is still shown.
                    </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Counted page views</CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-semibold tabular-nums">{traffic.views.toLocaleString()}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily unique visitors (sum)</CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-semibold tabular-nums">{traffic.dailyVisitors.toLocaleString()}</CardContent>
                    </Card>
                </div>
                <p className="text-muted-foreground text-sm">
                    Daily visitors are estimated from hashed IP addresses and reset each UTC day—not distinct people across this period. Same-page
                    refreshes within a one-minute bucket count once. Signed-in users, detected bots, prefetches and privacy opt-outs are excluded.
                    Records are retained for 90 days.
                </p>
                <Card>
                    <CardHeader>
                        <CardTitle>Views over time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {traffic.views ? (
                            <ChartContainer config={{ views: { label: 'Views', color: 'var(--chart-1)' } }} className="h-64 w-full">
                                <BarChart data={traffic.chart}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} minTickGap={40} />
                                    <YAxis allowDecimals={false} width={40} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="views" fill="var(--color-views)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-muted-foreground py-12 text-center text-sm">
                                No local views recorded for {scope ? 'this page' : 'the site'} in this period. Signed-in visits are excluded.
                            </p>
                        )}
                    </CardContent>
                </Card>
                <div className="grid gap-6 lg:grid-cols-2">
                    <BreakdownCard title={scope ? 'Recorded URLs' : 'Top pages'} items={traffic.pages} pageLinks days={days} />
                    <BreakdownCard title="Referrers" items={traffic.referrers} />
                    <BreakdownCard title="Browsers" items={traffic.browsers} />
                    <BreakdownCard title="Operating systems" items={traffic.platforms} />
                    <BreakdownCard title="Devices" items={traffic.devices} />
                </div>
            </div>
        </AppLayout>
    );
}
