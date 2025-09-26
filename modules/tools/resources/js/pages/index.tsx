import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Plus, Wrench, Settings, Package } from 'lucide-react';

export default function Index({ table }: { table: any }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tools', href: route('admin.tools.index') }];

    const handleCreateTool = () => {
        router.visit(route('admin.tools.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tools" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Tools</h2>
                        <p className="text-muted-foreground">Manage your tools and resources collection.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateTool}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Tool
                        </Button>
                    </div>
                </div>

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
