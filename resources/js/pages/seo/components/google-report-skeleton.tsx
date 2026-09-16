import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';

const placeholder = 'bg-muted motion-reduce:animate-none';

/** Reserve the report layout without displaying invented metric values. */
export function GoogleReportSkeleton() {
    return (
        <div aria-hidden="true" className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {['Visitors', 'Page Views', 'Avg. / Day', 'Bounce Rate', 'Avg. Duration'].map((label) => (
                    <div key={label} className="bg-card flex min-h-28 flex-col gap-3 rounded-lg border p-4">
                        <span className="text-muted-foreground text-[0.6875rem] font-medium tracking-[0.08em] uppercase">{label}</span>
                        <Skeleton className={`${placeholder} h-9 w-24 max-w-full`} />
                    </div>
                ))}
            </div>
            <Card>
                <CardHeader className="flex min-h-14 flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium">Traffic</CardTitle>
                    <Skeleton className={`${placeholder} h-9 w-40`} />
                </CardHeader>
                <CardContent>
                    <Skeleton className={`${placeholder} h-[220px] w-full`} />
                </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
                {['Pages & referrers', 'Countries'].map((title) => (
                    <Card key={title}>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {[1, 2, 3, 4, 5].map((row) => (
                                <div key={row} className="flex items-center justify-between gap-6">
                                    <Skeleton className={`${placeholder} h-4 w-3/5`} />
                                    <Skeleton className={`${placeholder} h-4 w-10`} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
