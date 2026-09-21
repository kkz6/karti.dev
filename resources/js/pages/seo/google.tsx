import { ArrowLeft, BarChart3, CalendarIcon, FileText, Link2, RefreshCw, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Deferred, Head, Link, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { PageContainer } from '@shared/components/page-container';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import { useAdminTab } from '@shared/hooks/use-admin-tab';
import AppLayout from '@shared/layouts/app-layout';
import { cn } from '@shared/lib/utils';
import { type BreadcrumbItem } from '@shared/types';
import { GoogleReportSkeleton } from './components/google-report-skeleton';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SEO',
        href: '/admin/seo',
    },
];

type TimeRange = '24h' | '7d' | '30d' | '90d';

const timeRangeLabels: Record<TimeRange, string> = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 3 months',
};

interface ChartDataPoint {
    date: string;
    visitors: number;
    pageViews: number;
}

interface AnalyticsStats {
    totalVisitors: number;
    totalPageViews: number;
    visitorChange: number;
    avgSessionDuration: string | null;
    bounceRate: number | null;
}

interface MostVisitedPage {
    path: string;
    title: string;
    views: number;
}

interface TopReferrer {
    source: string;
    sessions: number;
}

interface TopCountry {
    country: string;
    sessions: number;
}

interface AnalyticsData {
    chartData: ChartDataPoint[];
    stats: AnalyticsStats;
    mostVisitedPages: MostVisitedPage[];
    topReferrers: TopReferrer[];
    topCountries: TopCountry[];
    configured: boolean;
    error?: string;
}

function MetricItem({ label, value, change, suffix }: { label: string; value: string | number; change?: number; suffix?: string }) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="bg-card flex min-h-28 flex-col gap-3 rounded-lg border p-4">
            <span className="text-muted-foreground text-[0.6875rem] font-medium tracking-[0.08em] uppercase">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-[-0.02em] tabular-nums">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {suffix && <span className="text-muted-foreground text-base font-normal">{suffix}</span>}
                </span>
                {change !== undefined && (
                    <span
                        className={cn(
                            'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium tabular-nums',
                            isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400',
                        )}
                    >
                        {isPositive ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
                        {isPositive ? '+' : ''}
                        {change}%
                    </span>
                )}
            </div>
        </div>
    );
}

// The palette tokens are oklch(), so they're used directly — wrapping them in
// hsl() produced an invalid colour and the bars fell back to black.
const chartConfig = {
    visitors: {
        label: 'Visitors',
        color: 'var(--chart-1)',
    },
    pageViews: {
        label: 'Page Views',
        color: 'var(--chart-2)',
    },
} satisfies ChartConfig;

function VisitorsChart({ data, metric }: { data: ChartDataPoint[]; metric: 'visitors' | 'pageViews' }) {
    const config = {
        [metric]: chartConfig[metric],
    };

    return (
        <ChartContainer config={config} className="h-[220px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={48}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => value.toLocaleString()} width={50} />
                <ChartTooltip
                    cursor={{ fill: 'color-mix(in oklab, var(--muted) 45%, transparent)' }}
                    content={
                        <ChartTooltipContent
                            labelFormatter={(value) => {
                                return new Date(value).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                });
                            }}
                        />
                    }
                />
                <Bar
                    dataKey={metric}
                    fill={`var(--color-${metric})`}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={44}
                    minPointSize={2}
                    isAnimationActive={false}
                />
            </BarChart>
        </ChartContainer>
    );
}

function DataList<T extends object>({
    items,
    labelKey,
    valueKey,
    emptyMessage = 'No data available',
}: {
    items: T[];
    labelKey: keyof T;
    valueKey: keyof T;
    emptyMessage?: string;
}) {
    if (items.length === 0) {
        return <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">{emptyMessage}</div>;
    }

    const maxValue = Math.max(...items.map((item) => Number(item[valueKey]) || 0));

    return (
        <div className="space-y-2">
            {items.map((item, index) => {
                const label = String(item[labelKey] || 'Unknown');
                const value = Number(item[valueKey]) || 0;
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                    <div key={index} className="group">
                        <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="truncate font-medium" title={label}>
                                {label || 'Direct'}
                            </span>
                            <span className="text-muted-foreground ml-2 shrink-0 tabular-nums">{value.toLocaleString()}</span>
                        </div>
                        <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
                            <div className="bg-primary/70 h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const countryToCode: Record<string, string> = {
    'United States': 'US',
    'United Kingdom': 'GB',
    Germany: 'DE',
    France: 'FR',
    Canada: 'CA',
    Australia: 'AU',
    India: 'IN',
    Japan: 'JP',
    China: 'CN',
    Brazil: 'BR',
    Mexico: 'MX',
    Spain: 'ES',
    Italy: 'IT',
    Netherlands: 'NL',
    Russia: 'RU',
    'South Korea': 'KR',
    Indonesia: 'ID',
    Turkey: 'TR',
    'Saudi Arabia': 'SA',
    Switzerland: 'CH',
    Poland: 'PL',
    Sweden: 'SE',
    Belgium: 'BE',
    Argentina: 'AR',
    Norway: 'NO',
    Austria: 'AT',
    Ireland: 'IE',
    Denmark: 'DK',
    Singapore: 'SG',
    Malaysia: 'MY',
    Philippines: 'PH',
    Thailand: 'TH',
    Vietnam: 'VN',
    'South Africa': 'ZA',
    Nigeria: 'NG',
    Egypt: 'EG',
    Israel: 'IL',
    'United Arab Emirates': 'AE',
    'New Zealand': 'NZ',
    Portugal: 'PT',
    'Czech Republic': 'CZ',
    Romania: 'RO',
    Ukraine: 'UA',
    Finland: 'FI',
    Greece: 'GR',
    Hungary: 'HU',
    Colombia: 'CO',
    Chile: 'CL',
    Pakistan: 'PK',
    Bangladesh: 'BD',
};

function getCountryFlag(country: string): string {
    // If already a 2-letter code, use it directly
    const trimmed = (country || '').trim();
    if (/^[A-Za-z]{2}$/.test(trimmed)) {
        const directCodePoints = trimmed
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...directCodePoints);
    }
    // Try mapping a known country name to its code
    const code = countryToCode[trimmed];
    if (code) {
        const codePoints = code
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    }
    // Fallback globe
    return '🌍';
}

function CountriesList({ countries }: { countries: TopCountry[] }) {
    if (countries.length === 0) {
        return <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">No data available</div>;
    }

    const maxValue = Math.max(...countries.map((c) => c.sessions));
    const total = countries.reduce((sum, c) => sum + c.sessions, 0);

    return (
        <TooltipProvider delayDuration={100}>
            <div className="space-y-2">
                {countries.map((country, index) => {
                    const percentage = maxValue > 0 ? (country.sessions / maxValue) * 100 : 0;
                    const sharePercent = total > 0 ? ((country.sessions / total) * 100).toFixed(1) : '0';

                    return (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <div className="group relative cursor-default">
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="text-base leading-none">{getCountryFlag(country.country)}</span>
                                            <span className="truncate font-medium">{country.country}</span>
                                        </div>
                                        <div className="ml-2 flex shrink-0 items-center gap-2">
                                            <span className="text-muted-foreground tabular-nums">{country.sessions.toLocaleString()}</span>
                                            <span className="text-muted-foreground/70 w-12 text-right text-xs tabular-nums">{sharePercent}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
                                        <div
                                            className="bg-primary/70 group-hover:bg-primary h-full rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="flex items-center gap-2">
                                <span className="text-lg">{getCountryFlag(country.country)}</span>
                                <div>
                                    <p className="font-medium">{country.country}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {country.sessions.toLocaleString()} page views ({sharePercent}% of total)
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}

function GoogleReport({ analytics, onRetry, isUpdating }: { analytics: AnalyticsData; onRetry: () => void; isUpdating: boolean }) {
    const [activeTab, setActiveTab] = useAdminTab(['pages', 'referrers'], 'pages');
    const [chartMetric, setChartMetric] = React.useState<'visitors' | 'pageViews'>('visitors');
    const reportTabClassName =
        'text-muted-foreground hover:text-foreground h-11 gap-2 rounded-none border-b-2 border-transparent px-2 py-0 text-sm transition-colors data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none focus-visible:ring-inset';

    if (!analytics.configured) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Google report unavailable</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p role="status" className="text-muted-foreground text-sm">
                        {analytics.error || 'Google Analytics could not return this report. Please try again.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={onRetry} disabled={isUpdating}>
                            <RefreshCw /> Try again
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/admin/seo">View local traffic</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const totalVisitors = analytics.stats.totalVisitors;
    const totalPageViews = analytics.stats.totalPageViews;
    const avgPerDay = analytics.chartData.length > 0 ? Math.round(totalVisitors / analytics.chartData.length) : 0;

    return (
        <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                <MetricItem label="Visitors" value={totalVisitors} change={analytics.stats.visitorChange} />
                <MetricItem label="Page Views" value={totalPageViews} />
                <MetricItem label="Avg. / Day" value={avgPerDay} />
                <MetricItem
                    label="Bounce Rate"
                    value={analytics.stats.bounceRate ?? '—'}
                    suffix={analytics.stats.bounceRate === null ? undefined : '%'}
                />
                <MetricItem label="Avg. Duration" value={analytics.stats.avgSessionDuration ?? '—'} />
            </div>

            {/* Main Chart */}
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">Traffic</CardTitle>
                    <div className="flex gap-1">
                        <Button
                            variant={chartMetric === 'visitors' ? 'secondary' : 'ghost'}
                            aria-pressed={chartMetric === 'visitors'}
                            onClick={() => setChartMetric('visitors')}
                        >
                            Visitors
                        </Button>
                        <Button
                            variant={chartMetric === 'pageViews' ? 'secondary' : 'ghost'}
                            aria-pressed={chartMetric === 'pageViews'}
                            onClick={() => setChartMetric('pageViews')}
                        >
                            Page Views
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {analytics.chartData.length ? (
                        <VisitorsChart data={analytics.chartData} metric={chartMetric} />
                    ) : (
                        <p className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
                            No traffic reported for this period.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Data Panels */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Pages & Referrers */}
                <Card>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <CardHeader className="border-b pt-1 pb-0">
                            <TabsList aria-label="Traffic breakdown" className="h-auto w-full justify-start gap-4 rounded-none bg-transparent p-0">
                                <TabsTrigger value="pages" className={reportTabClassName}>
                                    <FileText className="size-4" aria-hidden="true" />
                                    Pages
                                </TabsTrigger>
                                <TabsTrigger value="referrers" className={reportTabClassName}>
                                    <Link2 className="size-4" aria-hidden="true" />
                                    Referrers
                                </TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <TabsContent value="pages" className="mt-0">
                                <div className="text-muted-foreground mb-3 flex items-center justify-between gap-3 text-xs">
                                    <span>Page</span>
                                    <span>Views</span>
                                </div>
                                <DataList
                                    items={analytics.mostVisitedPages.map((p) => ({
                                        ...p,
                                        label: p.title || p.path,
                                    }))}
                                    labelKey="label"
                                    valueKey="views"
                                    emptyMessage="No page views recorded for this period."
                                />
                            </TabsContent>
                            <TabsContent value="referrers" className="mt-0">
                                <div className="text-muted-foreground mb-3 flex items-center justify-between gap-3 text-xs">
                                    <span>Source</span>
                                    <span>Sessions</span>
                                </div>
                                <DataList
                                    items={analytics.topReferrers}
                                    labelKey="source"
                                    valueKey="sessions"
                                    emptyMessage="No referrers recorded for this period."
                                />
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>

                {/* Countries */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Countries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CountriesList countries={analytics.topCountries} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function GoogleAnalyticsPage(props: { analytics?: AnalyticsData; period: TimeRange }) {
    const [activeTab] = useAdminTab(['pages', 'referrers'], 'pages');
    const [isUpdating, setIsUpdating] = React.useState(false);
    const loadReport = (period: TimeRange = props.period) => {
        setIsUpdating(true);
        router.get(
            '/admin/seo/google',
            { period, tab: activeTab },
            {
                only: ['analytics', 'period'],
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsUpdating(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={[...breadcrumbs, { title: 'Google Analytics', href: '/admin/seo/google' }]}>
            <Head title="SEO · Google Analytics" />
            <PageContainer className="content-index space-y-6">
                <IndexHeader
                    title="Google Analytics"
                    icon={BarChart3}
                    actions={
                        <Button asChild variant="outline">
                            <Link href="/admin/seo">
                                <ArrowLeft /> Local traffic
                            </Link>
                        </Button>
                    }
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                    <p className="text-muted-foreground text-sm">Google reports · Cached for 15 minutes</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <span role="status" className="text-muted-foreground text-xs empty:hidden">
                            {isUpdating ? 'Updating report…' : !props.analytics ? 'Loading report…' : ''}
                        </span>
                        <Select
                            value={props.period}
                            onValueChange={(value) => loadReport(value as TimeRange)}
                            disabled={isUpdating || !props.analytics}
                        >
                            <SelectTrigger aria-label="Reporting period" className="w-44">
                                <CalendarIcon className="size-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(timeRangeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div aria-busy={isUpdating || !props.analytics}>
                    <Deferred data="analytics" fallback={<GoogleReportSkeleton />}>
                        {props.analytics && <GoogleReport analytics={props.analytics} onRetry={() => loadReport()} isUpdating={isUpdating} />}
                    </Deferred>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
