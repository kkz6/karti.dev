import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Link2, Plus, Wrench } from 'lucide-react';

export default function Index({ table, filters }: { table: any; filters: any }) {
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

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
                            <Wrench className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.meta?.totalCount || 0}</div>
                            <p className="text-muted-foreground text-xs">Tools in your collection</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Featured Tools</CardTitle>
                            <Link2 className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.data?.filter((tool: any) => tool.featured).length || 0}</div>
                            <p className="text-muted-foreground text-xs">Highlighted tools</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tools Table */}
                <div className="flex-1">
                    <InertiaTableWrapper table={table} filters={filters} />
                </div>
            </div>
        </AppLayout>
    );
}
