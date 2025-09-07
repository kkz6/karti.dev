import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Briefcase, Globe, Plus, Star } from 'lucide-react';

export default function Index({ table, filters }: { table: any; filters: any }) {
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

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                            <Briefcase className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.meta?.totalCount || 0}</div>
                            <p className="text-muted-foreground text-xs">Portfolio projects</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Published</CardTitle>
                            <Globe className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {table.data?.filter((project: any) => project.status === 'published').length || 0}
                            </div>
                            <p className="text-muted-foreground text-xs">Live projects</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Featured</CardTitle>
                            <Star className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.data?.filter((project: any) => project.featured).length || 0}</div>
                            <p className="text-muted-foreground text-xs">Highlighted projects</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Technologies</CardTitle>
                            <Briefcase className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {[...new Set(table.data?.flatMap((p: any) => p.technologies || []))].length || 0}
                            </div>
                            <p className="text-muted-foreground text-xs">Unique technologies</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Projects Table */}
                <div className="flex-1">
                    <InertiaTableWrapper table={table} filters={filters} />
                </div>
            </div>
        </AppLayout>
    );
}
