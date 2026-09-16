import { Head, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import type { TableConfig } from '@table/components';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Package, Settings, Wrench } from 'lucide-react';

export default function Index({ table }: { table: TableConfig }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tools', href: route('admin.tools.index') }];

    const handleCreateTool = () => {
        router.visit(route('admin.tools.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tools" />
            <div className="content-index flex flex-col gap-8">
                <IndexHeader title="Tools" icon={Wrench} actions={<Button onClick={handleCreateTool}>Create tool</Button>} />
                <LocalTrafficCard compact />

                {/* Tools Table */}
                <div className="flex-1">
                    <InertiaTableWrapper
                        resource={table}
                        emptyState={{
                            title: 'No tools found',
                            description: 'Get started by adding your first tool or resource.',
                            icons: [Wrench, Settings, Package],
                            action: {
                                label: 'Create Tool',
                                onClick: handleCreateTool,
                            },
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
