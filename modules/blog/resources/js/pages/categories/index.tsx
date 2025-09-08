import { Head, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Plus, Tag, TagsIcon } from 'lucide-react';

export default function Index({ categories }: { categories: any }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: 'Categories', href: route('admin.categories.index') },
    ];

    const handleCreateCategory = () => {
        router.visit(route('admin.categories.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateCategory}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                        </Button>
                    </div>
                </div>
                <div className="flex-1">
                    <InertiaTableWrapper
                        resource={categories}
                        emptyState={{
                            title: 'No categories found',
                            description: 'Get started by creating your first category to organize your content.',
                            icons: [TagsIcon, Tag, Plus],
                            action: {
                                label: 'Create Category',
                                onClick: handleCreateCategory,
                            },
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
