import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { FileText, FolderTree, Plus } from 'lucide-react';

export default function Index({ table, filters }: { table: any; filters: any }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: 'Categories', href: route('admin.categories.index') },
    ];

    const handleCreateCategory = () => {
        router.visit(route('admin.categories.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blog Categories" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Blog Categories</h2>
                        <p className="text-muted-foreground">Manage your blog categories and organize your content.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateCategory}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                            <FolderTree className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{table.meta?.totalCount || 0}</div>
                            <p className="text-muted-foreground text-xs">Active categories in your blog</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Categorized Articles</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {table.data?.reduce((sum: number, cat: any) => sum + (cat.articles_count || 0), 0) || 0}
                            </div>
                            <p className="text-muted-foreground text-xs">Articles assigned to categories</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Categories Table */}
                <div className="flex-1">
                    <InertiaTableWrapper table={table} filters={filters} />
                </div>
            </div>
        </AppLayout>
    );
}
