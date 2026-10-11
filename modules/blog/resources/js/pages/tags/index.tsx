import { Head, router } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper, type Action, type TableConfig } from '@table/components';
import { Plus, Tag, Tags as TagsIcon } from 'lucide-react';

interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    articles_count: number;
    created_at: string;
    updated_at: string;
    _primary_key: number;
}

export default function Index({ tags, canCreate }: { tags: TableConfig<Tag>; canCreate: boolean }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: 'Tags', href: route('admin.tags.index') },
    ];

    const handleCustomAction = async (action: Action, keys: (string | number)[], onFinish?: () => void) => {
        if (onFinish) onFinish();
    };

    const handleCreateTag = () => {
        router.visit(route('admin.tags.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />
            <AdminPageContent>
                {/* Header */}
                <IndexHeader title="Tags" icon={TagsIcon} actions={canCreate ? <Button onClick={handleCreateTag}>Create tag</Button> : undefined} />

                <InertiaTableWrapper
                    resource={tags}
                    emptyState={{
                        title: 'No tags yet',
                        description: 'Get started by creating your first tag to organize your content.',
                        icons: [TagsIcon, Tag, Plus],
                        action: canCreate
                            ? {
                                  label: 'Create Tag',
                                  onClick: handleCreateTag,
                              }
                            : undefined,
                    }}
                    onCustomAction={handleCustomAction}
                />
            </AdminPageContent>
        </AppLayout>
    );
}
