import { Head, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { PageContainer } from '@shared/components/page-container';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import type { TableConfig } from '@table/components';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Mic, Podcast, Video } from 'lucide-react';

export default function Index({ table }: { table: TableConfig }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Speaking Events', href: route('admin.speaking.index') }];

    const handleCreateEvent = () => {
        router.visit(route('admin.speaking.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Speaking Events" />
            <PageContainer className="content-index flex flex-col gap-8">
                <IndexHeader title="Speaking Events" icon={Mic} actions={<Button onClick={handleCreateEvent}>Create event</Button>} />
                <LocalTrafficCard compact />

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
            </PageContainer>
        </AppLayout>
    );
}
