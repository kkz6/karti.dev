import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Mic, Plus, Podcast, Video } from 'lucide-react';

export default function Index({ table, filters }: { table: any; filters: any }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Speaking Events', href: route('admin.speaking.index') }];

    const handleCreateEvent = () => {
        router.visit(route('admin.speaking.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Speaking Events" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Speaking Events</h2>
                        <p className="text-muted-foreground">Manage your conferences, podcasts, and other speaking engagements.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateEvent}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Event
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                            <Mic className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.meta?.totalCount || 0}</div>
                            <p className="text-muted-foreground text-xs">Speaking engagements</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conferences</CardTitle>
                            <Video className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {table.data?.filter((event: any) => event.event_type === 'conference').length || 0}
                            </div>
                            <p className="text-muted-foreground text-xs">Conference talks</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Podcasts</CardTitle>
                            <Podcast className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.data?.filter((event: any) => event.event_type === 'podcast').length || 0}</div>
                            <p className="text-muted-foreground text-xs">Podcast appearances</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Featured</CardTitle>
                            <Mic className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.data?.filter((event: any) => event.featured).length || 0}</div>
                            <p className="text-muted-foreground text-xs">Highlighted events</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Speaking Events Table */}
                <div className="flex-1">
                    <InertiaTableWrapper table={table} filters={filters} />
                </div>
            </div>
        </AppLayout>
    );
}
