import { Head, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import type { TableConfig } from '@table/components';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Briefcase, Code, Laptop } from 'lucide-react';

export default function Index({ table }: { table: TableConfig }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Projects', href: route('admin.projects.index') }];

    const handleCreateProject = () => {
        router.visit(route('admin.projects.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="content-index flex flex-col gap-8">
                <IndexHeader title="Projects" icon={Briefcase} actions={<Button onClick={handleCreateProject}>Create project</Button>} />
                <LocalTrafficCard compact />

                {/* Projects Table */}
                <div className="flex-1">
                    <InertiaTableWrapper
                        resource={table}
                        emptyState={{
                            title: 'No projects found',
                            description: 'Get started by creating your first project showcase.',
                            icons: [Code, Laptop, Briefcase],
                            action: {
                                label: 'Create Project',
                                onClick: handleCreateProject,
                            },
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
