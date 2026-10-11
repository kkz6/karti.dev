import { Head } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { PageContainer } from '@shared/components/page-container';
import { StatSummary } from '@shared/components/stat-summary';
import AppLayout from '@shared/layouts/app-layout';
import type { TableConfig } from '@table/components';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Mail } from 'lucide-react';

export default function Subscribers({ table, counts }: { table: TableConfig; counts: { active: number; pending: number; unsubscribed: number } }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Newsletter', href: route('admin.newsletter.index') }]}>
            <Head title="Newsletter subscribers" />
            <PageContainer className="content-index space-y-6">
                <IndexHeader title="Newsletter" icon={Mail} />
                <p className="text-muted-foreground text-sm">
                    Only confirmed, active addresses are eligible for newsletters. Pending addresses have not opted in. Campaign sending is not
                    enabled here.
                </p>
                <StatSummary
                    items={Object.entries(counts).map(([key, value]) => ({
                        label: key.charAt(0).toUpperCase() + key.slice(1),
                        value: value.toLocaleString(),
                        icon: Mail,
                    }))}
                />
                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: 'No subscribers yet',
                        description: 'Email signups from the website will appear here, along with their confirmation status.',
                        icons: [Mail],
                    }}
                />
            </PageContainer>
        </AppLayout>
    );
}
