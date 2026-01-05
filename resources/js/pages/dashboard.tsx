import * as React from 'react';
import { TrendingDownIcon, TrendingUpIcon, CalendarIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { Head, router } from '@inertiajs/react';
import { cn } from '@shared/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
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
    avgSessionDuration: string;
    bounceRate: number;
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

interface DashboardProps {
    analytics: AnalyticsData;
    period: TimeRange;
}

function MetricItem({
    label,
    value,
    change,
    suffix,
}: {
    label: string;
    value: string | number;
    change?: number;
    suffix?: string;
}) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {suffix && <span className="text-base font-normal text-muted-foreground">{suffix}</span>}
                </span>
                {change !== undefined && (
                    <span className={cn(
                        "flex items-center gap-0.5 text-xs font-medium",
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                        {isPositive ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
                        {isPositive ? '+' : ''}{change}%
                    </span>
                )}
            </div>
        </div>
    );
}

const chartConfig = {
    visitors: {
        label: 'Visitors',
        color: 'hsl(var(--chart-1))',
    },
    pageViews: {
        label: 'Page Views',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig;

function VisitorsChart({ data, metric }: { data: ChartDataPoint[]; metric: 'visitors' | 'pageViews' }) {
    const config = {
        [metric]: chartConfig[metric],
    };

    return (
        <ChartContainer config={config} className="h-[280px] w-full">
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
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.toLocaleString()}
                    width={50}
                />
                <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
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
                    radius={[2, 2, 0, 0]}
                />
            </BarChart>
        </ChartContainer>
    );
}

function DataList({
    items,
    labelKey,
    valueKey,
    emptyMessage = 'No data available',
}: {
    items: Record<string, unknown>[];
    labelKey: string;
    valueKey: string;
    emptyMessage?: string;
}) {
    if (items.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        );
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
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="truncate font-medium" title={label}>
                                {label || 'Direct'}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground ml-2">
                                {value.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                            <div
                                className="h-full rounded-full bg-primary/70 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                            />
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
    'Germany': 'DE',
    'France': 'FR',
    'Canada': 'CA',
    'Australia': 'AU',
    'India': 'IN',
    'Japan': 'JP',
    'China': 'CN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Spain': 'ES',
    'Italy': 'IT',
    'Netherlands': 'NL',
    'Russia': 'RU',
    'South Korea': 'KR',
    'Indonesia': 'ID',
    'Turkey': 'TR',
    'Saudi Arabia': 'SA',
    'Switzerland': 'CH',
    'Poland': 'PL',
    'Sweden': 'SE',
    'Belgium': 'BE',
    'Argentina': 'AR',
    'Norway': 'NO',
    'Austria': 'AT',
    'Ireland': 'IE',
    'Denmark': 'DK',
    'Singapore': 'SG',
    'Malaysia': 'MY',
    'Philippines': 'PH',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'South Africa': 'ZA',
    'Nigeria': 'NG',
    'Egypt': 'EG',
    'Israel': 'IL',
    'United Arab Emirates': 'AE',
    'New Zealand': 'NZ',
    'Portugal': 'PT',
    'Czech Republic': 'CZ',
    'Romania': 'RO',
    'Ukraine': 'UA',
    'Finland': 'FI',
    'Greece': 'GR',
    'Hungary': 'HU',
    'Colombia': 'CO',
    'Chile': 'CL',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
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
        return (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No data available
            </div>
        );
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
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-base leading-none">{getCountryFlag(country.country)}</span>
                                            <span className="truncate font-medium">{country.country}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className="tabular-nums text-muted-foreground">
                                                {country.sessions.toLocaleString()}
                                            </span>
                                            <span className="tabular-nums text-xs text-muted-foreground/70 w-12 text-right">
                                                {sharePercent}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                                        <div
                                            className="h-full rounded-full bg-primary/70 transition-all duration-300 group-hover:bg-primary"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="flex items-center gap-2">
                                <span className="text-lg">{getCountryFlag(country.country)}</span>
                                <div>
                                    <p className="font-medium">{country.country}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {country.sessions.toLocaleString()} visitors ({sharePercent}% of total)
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

export default function Dashboard({ analytics, period }: DashboardProps) {
    const [chartMetric, setChartMetric] = React.useState<'visitors' | 'pageViews'>('visitors');
    const [isLoading, setIsLoading] = React.useState(false);

    const handlePeriodChange = (newPeriod: TimeRange) => {
        setIsLoading(true);
        router.get(
            '/dashboard',
            { period: newPeriod },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const totalVisitors = analytics.chartData.reduce((sum, day) => sum + day.visitors, 0);
    const totalPageViews = analytics.chartData.reduce((sum, day) => sum + day.pageViews, 0);
    const avgPerDay = analytics.chartData.length > 0 ? Math.round(totalVisitors / analytics.chartData.length) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold">Analytics</h1>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <Select value={period} onValueChange={(v) => handlePeriodChange(v as TimeRange)} disabled={isLoading}>
                            <SelectTrigger className="h-8 w-[140px] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(timeRangeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!analytics.configured && (
                    <div className="rounded-md border border-amber-200/50 bg-amber-50/50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                        <div>Analytics not configured. Showing demo data.</div>
                        {analytics.error && (
                            <div className="mt-1 text-xs opacity-80">
                                {analytics.error}
                            </div>
                        )}
                    </div>
                )}

                {/* Metrics Row */}
                <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5", isLoading && "opacity-50")}>
                    <MetricItem
                        label="Visitors"
                        value={totalVisitors}
                        change={analytics.stats.visitorChange}
                    />
                    <MetricItem
                        label="Page Views"
                        value={totalPageViews}
                    />
                    <MetricItem
                        label="Avg. / Day"
                        value={avgPerDay}
                    />
                    <MetricItem
                        label="Bounce Rate"
                        value={analytics.stats.bounceRate}
                        suffix="%"
                    />
                    <MetricItem
                        label="Avg. Duration"
                        value={analytics.stats.avgSessionDuration}
                    />
                </div>

                {/* Main Chart */}
                <Card className={cn("border-border/50", isLoading && "opacity-50")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">Traffic</CardTitle>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setChartMetric('visitors')}
                                className={cn(
                                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                    chartMetric === 'visitors'
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                Visitors
                            </button>
                            <button
                                onClick={() => setChartMetric('pageViews')}
                                className={cn(
                                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                    chartMetric === 'pageViews'
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                Page Views
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <VisitorsChart data={analytics.chartData} metric={chartMetric} />
                    </CardContent>
                </Card>

                {/* Data Panels */}
                <div className={cn("grid gap-4 lg:grid-cols-2", isLoading && "opacity-50")}>
                    {/* Pages & Referrers */}
                    <Card className="border-border/50">
                        <Tabs defaultValue="pages" className="w-full">
                            <CardHeader className="pb-3">
                                <TabsList className="h-8 w-fit">
                                    <TabsTrigger value="pages" className="text-xs px-3">Pages</TabsTrigger>
                                    <TabsTrigger value="referrers" className="text-xs px-3">Referrers</TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent>
                                <TabsContent value="pages" className="mt-0">
                                    <DataList
                                        items={analytics.mostVisitedPages.map((p) => ({
                                            ...p,
                                            label: p.title || p.path,
                                        }))}
                                        labelKey="label"
                                        valueKey="views"
                                    />
                                </TabsContent>
                                <TabsContent value="referrers" className="mt-0">
                                    <DataList
                                        items={analytics.topReferrers}
                                        labelKey="source"
                                        valueKey="sessions"
                                    />
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>

                    {/* Countries */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Countries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CountriesList countries={analytics.topCountries} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
