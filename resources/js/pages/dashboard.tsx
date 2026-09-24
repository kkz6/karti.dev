import { Head, Link, usePage } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import { Button } from '@shared/components/ui/button';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components/ui/chart';
import AppLayout from '@shared/layouts/app-layout';
import { type SharedData } from '@shared/types';
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Camera,
    CircleDot,
    Eye,
    FileImage,
    FileText,
    FolderKanban,
    LayoutGrid,
    Mail,
    Plus,
    Users,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type Trend = {
    direction: 'up' | 'down' | 'flat' | 'new';
    percent: number | null;
};

type ContentCount = {
    total: number;
    published: number;
    drafts: number;
};

type DashboardOverview = {
    period: { days: number; label: string; timezone: string };
    traffic: {
        views: number;
        dailyVisitors: number;
        viewsTrend: Trend;
        visitorsTrend: Trend;
        chart: Array<{ date: string; views: number; visitors: number }>;
        topPages: Array<{ path: string; views: number; visitors: number; url: string }>;
        enabled: boolean;
    };
    newsletter: {
        active: number;
        newSubscribers: number;
        newTrend: Trend;
        pending: number;
        unsubscribed: number;
        confirmationRate: number;
    };
    content: {
        articles: ContentCount;
        galleries: ContentCount;
        projects: ContentCount;
        media: number;
    };
    bookings: { pending: number; confirmed: number };
    contacts: { new: number; open: number };
    recentContent: Array<{
        id: string;
        type: string;
        title: string;
        status: string;
        updatedAt: string | null;
        url: string;
    }>;
};

const chartConfig = {
    views: { label: 'Page views', color: 'var(--primary)' },
    visitors: { label: 'Visitors', color: 'var(--chart-2)' },
} satisfies ChartConfig;

function TrendLabel({ trend }: { trend: Trend }) {
    if (trend.direction === 'new') {
        return <span className="text-primary text-xs font-medium">New activity</span>;
    }

    if (trend.direction === 'flat' || trend.percent === null) {
        return <span className="text-muted-foreground text-xs">No change</span>;
    }

    const DirectionIcon = trend.direction === 'up' ? ArrowUpRight : ArrowDownRight;

    return (
        <span
            className={
                trend.direction === 'up'
                    ? 'text-primary flex items-center text-xs font-medium'
                    : 'text-destructive flex items-center text-xs font-medium'
            }
        >
            <DirectionIcon className="mr-0.5 size-3.5" aria-hidden="true" />
            {trend.percent}%
        </span>
    );
}

function Metric({ label, value, trend, icon: Icon }: { label: string; value: number; trend?: Trend; icon: typeof Eye }) {
    return (
        <div className="min-w-0 px-5 py-4 first:pl-0 last:pr-0 sm:px-6">
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <Icon className="size-4" aria-hidden="true" />
                {label}
            </div>
            <div className="mt-2 flex items-end gap-2">
                <strong className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">{value.toLocaleString()}</strong>
                {trend ? <TrendLabel trend={trend} /> : null}
            </div>
        </div>
    );
}

function ContentRow({ label, counts, href, icon: Icon }: { label: string; counts: ContentCount; href: string; icon: typeof FileText }) {
    return (
        <Link
            href={href}
            className="group hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-3 rounded-md px-2 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
            <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{label}</span>
                    <span className="font-semibold tabular-nums">{counts.total.toLocaleString()}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                    {counts.published} published · {counts.drafts} draft{counts.drafts === 1 ? '' : 's'}
                </p>
            </div>
            <ArrowRight className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        </Link>
    );
}

function formatDate(value: string | null): string {
    if (!value) return 'Recently';

    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function Dashboard({ overview }: { overview: DashboardOverview }) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.trim().split(/\s+/)[0];
    const maxPageViews = Math.max(...overview.traffic.topPages.map((page) => page.views), 1);
    const hasTraffic = overview.traffic.chart.some((point) => point.views > 0 || point.visitors > 0);

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard') }]}>
            <Head title="Dashboard" />
            <PageContainer as="main" className="content-index space-y-8">
                <div>
                    <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                                <LayoutGrid className="size-4" aria-hidden="true" />
                                Dashboard
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {firstName}</h1>
                            <p className="text-muted-foreground mt-1 text-sm">A clear view of what is happening across your site.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline">
                                <Link href={route('admin.photography.create')}>
                                    <Camera className="size-4" aria-hidden="true" />
                                    New gallery
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={route('admin.blog.create')}>
                                    <Plus className="size-4" aria-hidden="true" />
                                    New article
                                </Link>
                            </Button>
                        </div>
                    </header>

                    <section
                        aria-label={`${overview.period.label} summary`}
                        className="grid divide-y border-b sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4"
                    >
                        <Metric label="Page views" value={overview.traffic.views} trend={overview.traffic.viewsTrend} icon={Eye} />
                        <Metric label="Daily visitors" value={overview.traffic.dailyVisitors} trend={overview.traffic.visitorsTrend} icon={Users} />
                        <Metric label="New subscribers" value={overview.newsletter.newSubscribers} trend={overview.newsletter.newTrend} icon={Mail} />
                        <Metric
                            label="Published content"
                            value={overview.content.articles.published + overview.content.galleries.published + overview.content.projects.published}
                            icon={CircleDot}
                        />
                    </section>
                </div>

                {!overview.traffic.enabled ? (
                    <div className="border-border bg-muted/30 rounded-lg border px-4 py-3 text-sm">
                        <span className="font-medium">Local analytics is paused.</span>{' '}
                        <span className="text-muted-foreground">Enable tracking in Site settings to start collecting traffic.</span>
                    </div>
                ) : null}

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
                    <section aria-labelledby="traffic-heading" className="min-w-0">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="traffic-heading" className="text-lg font-semibold">
                                    Traffic trend
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Views and unique visitors across the {overview.period.label.toLowerCase()}.
                                </p>
                            </div>
                            <Link
                                href={route('admin.seo.index')}
                                className="text-primary hover:text-primary/80 focus-visible:ring-ring shrink-0 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                            >
                                View analytics
                            </Link>
                        </div>
                        <div className="border-border/70 rounded-xl border p-3 sm:p-5">
                            {hasTraffic ? (
                                <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
                                    <AreaChart data={overview.traffic.chart} margin={{ left: -16, right: 8, top: 12, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="dashboardViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={28}
                                            tickFormatter={(date) =>
                                                new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
                                                    new Date(`${date}T00:00:00`),
                                                )
                                            }
                                        />
                                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={
                                                <ChartTooltipContent
                                                    indicator="line"
                                                    labelFormatter={(date) =>
                                                        new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(
                                                            new Date(`${date}T00:00:00`),
                                                        )
                                                    }
                                                />
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="var(--color-views)"
                                            strokeWidth={2}
                                            fill="url(#dashboardViews)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="visitors"
                                            stroke="var(--color-visitors)"
                                            strokeWidth={1.5}
                                            fill="transparent"
                                            strokeDasharray="4 4"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex h-[280px] flex-col items-center justify-center text-center">
                                    <Eye className="text-muted-foreground/60 size-7" aria-hidden="true" />
                                    <p className="mt-3 font-medium">No traffic yet</p>
                                    <p className="text-muted-foreground mt-1 max-w-xs text-sm">
                                        Visits will appear here as people explore your published pages.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <aside aria-labelledby="newsletter-heading" className="border-border/70 rounded-xl border p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 id="newsletter-heading" className="text-lg font-semibold">
                                    Newsletter health
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">Subscriber growth and confirmation quality.</p>
                            </div>
                            <Mail className="text-primary size-5" aria-hidden="true" />
                        </div>
                        <div className="mt-7">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <strong className="text-3xl font-semibold tracking-tight tabular-nums">
                                        {overview.newsletter.confirmationRate}%
                                    </strong>
                                    <p className="text-muted-foreground mt-1 text-xs">confirmation rate</p>
                                </div>
                                <span className="text-muted-foreground text-xs">{overview.newsletter.newSubscribers} new this period</span>
                            </div>
                            <div className="bg-muted mt-4 h-2 overflow-hidden rounded-full" aria-hidden="true">
                                <div
                                    className="bg-primary h-full rounded-full transition-[width]"
                                    style={{ width: `${overview.newsletter.confirmationRate}%` }}
                                />
                            </div>
                        </div>
                        <dl className="mt-7 divide-y text-sm">
                            <div className="flex items-center justify-between py-3">
                                <dt className="text-muted-foreground">Active subscribers</dt>
                                <dd className="font-semibold tabular-nums">{overview.newsletter.active}</dd>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <dt className="text-muted-foreground">Awaiting confirmation</dt>
                                <dd className="font-semibold tabular-nums">{overview.newsletter.pending}</dd>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <dt className="text-muted-foreground">Unsubscribed</dt>
                                <dd className="font-semibold tabular-nums">{overview.newsletter.unsubscribed}</dd>
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <dt className="text-muted-foreground">Pending consultations</dt>
                                <dd className="font-semibold tabular-nums">{overview.bookings.pending}</dd>
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <dt className="text-muted-foreground">Open contact messages</dt>
                                <dd className="font-semibold tabular-nums">{overview.contacts.open}</dd>
                            </div>
                        </dl>
                        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                            <Link
                                href={route('admin.contact.index')}
                                className="text-primary hover:text-primary/80 focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                            >
                                Contact inbox <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                            <Link
                                href={route('admin.newsletter.index')}
                                className="text-primary hover:text-primary/80 focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                            >
                                Subscribers <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </aside>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    <section aria-labelledby="top-pages-heading">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <h2 id="top-pages-heading" className="text-lg font-semibold">
                                    Top pages
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">The pages attracting the most attention.</p>
                            </div>
                            <span className="text-muted-foreground text-xs">{overview.period.label}</span>
                        </div>
                        {overview.traffic.topPages.length > 0 ? (
                            <div className="divide-y border-y">
                                {overview.traffic.topPages.map((page) => (
                                    <Link
                                        key={page.path}
                                        href={page.url}
                                        className="group focus-visible:ring-ring relative flex items-center gap-4 overflow-hidden py-3.5 pr-3 focus-visible:ring-2 focus-visible:outline-none sm:pr-4"
                                    >
                                        <span
                                            className="bg-primary/8 absolute inset-y-1 left-0 rounded-sm"
                                            style={{ width: `${Math.max((page.views / maxPageViews) * 100, 3)}%` }}
                                            aria-hidden="true"
                                        />
                                        <span className="relative min-w-0 flex-1 truncate pl-3 font-medium">{page.path}</span>
                                        <span className="text-muted-foreground relative text-xs tabular-nums">{page.visitors} visitors</span>
                                        <span className="relative w-14 text-right font-semibold tabular-nums">{page.views}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="border-border/70 rounded-lg border border-dashed px-5 py-10 text-center">
                                <p className="font-medium">No popular pages yet</p>
                                <p className="text-muted-foreground mt-1 text-sm">Your most visited pages will be ranked here.</p>
                            </div>
                        )}
                    </section>

                    <section aria-labelledby="content-heading">
                        <div className="mb-2">
                            <h2 id="content-heading" className="text-lg font-semibold">
                                Content library
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">Publishing progress across every collection.</p>
                        </div>
                        <div className="divide-y">
                            <ContentRow label="Articles" counts={overview.content.articles} href={route('admin.blog.index')} icon={FileText} />
                            <ContentRow label="Galleries" counts={overview.content.galleries} href={route('admin.photography.index')} icon={Camera} />
                            <ContentRow
                                label="Projects"
                                counts={overview.content.projects}
                                href={route('admin.projects.index')}
                                icon={FolderKanban}
                            />
                            <Link
                                href={route('media-manager')}
                                className="group hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-3 rounded-md px-2 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                                <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                                    <FileImage className="size-4" aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-medium">Media files</span>
                                        <span className="font-semibold tabular-nums">{overview.content.media.toLocaleString()}</span>
                                    </div>
                                    <p className="text-muted-foreground mt-0.5 text-xs">Original assets in your library</p>
                                </div>
                                <ArrowRight
                                    className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </section>
                </div>

                <section aria-labelledby="recent-heading" className="border-t pt-7">
                    <div className="mb-4">
                        <h2 id="recent-heading" className="text-lg font-semibold">
                            Recently updated
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">Jump back into your latest work.</p>
                    </div>
                    {overview.recentContent.length > 0 ? (
                        <div className="grid gap-x-8 md:grid-cols-2">
                            {overview.recentContent.map((entry) => (
                                <Link
                                    key={entry.id}
                                    href={entry.url}
                                    className="group hover:bg-muted/60 focus-visible:ring-ring flex min-w-0 items-center gap-3 rounded-md px-2 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-[11px] font-medium uppercase">
                                        {entry.type}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                                    <span className="text-muted-foreground shrink-0 text-xs capitalize">{entry.status}</span>
                                    <time dateTime={entry.updatedAt ?? undefined} className="text-muted-foreground hidden shrink-0 text-xs sm:block">
                                        {formatDate(entry.updatedAt)}
                                    </time>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="border-border/70 rounded-lg border border-dashed px-5 py-8 text-center">
                            <FileText className="text-muted-foreground/60 mx-auto size-6" aria-hidden="true" />
                            <p className="mt-2 font-medium">No content yet</p>
                            <p className="text-muted-foreground mt-1 text-sm">Create an article, gallery, or project to get started.</p>
                        </div>
                    )}
                </section>
            </PageContainer>
        </AppLayout>
    );
}
