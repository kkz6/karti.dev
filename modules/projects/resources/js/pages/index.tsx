import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Plus, Code, Laptop, Briefcase } from 'lucide-react';

export default function Index({ table }: { table: any }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Projects', href: route('admin.projects.index') }];

    const handleCreateProject = () => {
        router.visit(route('admin.projects.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                        <p className="text-muted-foreground">Manage your portfolio projects and case studies.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateProject}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Project
                        </Button>
                    </div>
                </div>

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
