import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Mic, Plus, Podcast, Video } from 'lucide-react';

export default function Index({ table }: { table: any }) {
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

                {/* Speaking Events Table */}
                <div className="flex-1">
                    <InertiaTableWrapper 
                        resource={table}
                        emptyState={{
                            title: 'No speaking events found',
                            description: 'Get started by creating your first speaking engagement.',
                            icons: [Mic, Podcast, Video],
                            action: {
                                label: 'Create Event',
                                onClick: handleCreateEvent,
                            },
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
