import { Link, usePage } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { ArrowUpRight, ChartNoAxesColumn } from 'lucide-react';

export type LocalTrafficSummary = {
    title: string;
    views: number;
    dailyVisitors: number;
    days: number;
    enabled: boolean;
    url: string;
    sharedPage: boolean;
};

/** The same local counters for content sidebars and section landing pages. */
export function LocalTrafficCard({ compact = false }: { compact?: boolean }) {
    const { localTraffic: traffic } = usePage<{ localTraffic?: LocalTrafficSummary }>().props;
    if (!traffic) return null;

    return (
        <section
            aria-label="Local analytics"
            className={cn('bg-card rounded-lg border p-4', compact ? 'flex flex-wrap items-center gap-4 sm:gap-6' : 'space-y-4')}
        >
            <div className={cn('min-w-0', compact && 'mr-auto')}>
                <h2 className="flex items-center gap-2 text-sm font-medium">
                    <ChartNoAxesColumn className="text-muted-foreground size-4" />
                    {traffic.sharedPage ? traffic.title : 'Local traffic'}
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                    Last {traffic.days} days · {traffic.sharedPage ? 'Page-level traffic' : 'This entry only'}
                </p>
                {!traffic.enabled && <p className="text-muted-foreground mt-1 text-xs">Tracking is disabled; showing retained data.</p>}
            </div>
            <dl className={cn('grid grid-cols-2 gap-6', compact && 'shrink-0')}>
                <div>
                    <dt className="text-muted-foreground text-xs">Views</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">{traffic.views.toLocaleString()}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground text-xs" title="Sum of daily IP-based estimates, not distinct people across the period">
                        Daily visitors (sum)
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">{traffic.dailyVisitors.toLocaleString()}</dd>
                </div>
            </dl>
            <Button asChild variant="outline" size="sm" className={compact ? '' : 'w-full'}>
                <Link href={traffic.url}>
                    View analytics
                    <ArrowUpRight className="size-4" />
                </Link>
            </Button>
            {!compact && (
                <p className="text-muted-foreground text-xs leading-relaxed">
                    {traffic.sharedPage ? 'These are visits to the shared public page, not views of this individual item. ' : ''}Signed-in visits and
                    detected bots are excluded. Daily visitor estimates reset each UTC day.
                </p>
            )}
        </section>
    );
}
