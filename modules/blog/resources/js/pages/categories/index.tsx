import { Head, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import type { TableConfig } from '@table/components';
import { InertiaTableWrapper } from '@table/components/Table/inertia-table-wrapper';
import { Plus, Tag, TagsIcon } from 'lucide-react';

export default function Index({ categories }: { categories: TableConfig }) {
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
            <div className="content-index flex flex-col gap-8">
                <IndexHeader title="Categories" icon={TagsIcon} actions={<Button onClick={handleCreateCategory}>Create category</Button>} />
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
