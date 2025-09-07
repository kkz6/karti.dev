import { Head } from '@inertiajs/react';
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

export default function Index({ tags }: { tags: TableConfig<Tag> }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: 'Tags', href: route('admin.tags.index') },
    ];

    const handleCustomAction = async (action: Action, keys: (string | number)[], onFinish?: () => void) => {
        // The table component handles actions automatically via the table configuration
        // This is only needed for custom actions not defined in the table
        if (onFinish) onFinish();
    };

    const handleCreateTag = () => {
        window.location.href = route('admin.tags.create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tags" />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Tags</h2>
                        <p className="text-muted-foreground">Manage your blog tags and organize your content.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateTag}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Tag
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <TagsIcon className="h-5 w-5 text-purple-500" />
                            <span className="font-medium">Total Tags</span>
                        </div>
                        <p className="text-2xl font-bold">{tags.results?.total || 0}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <Tag className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">Tagged Articles</span>
                        </div>
                        <p className="text-2xl font-bold">{tags.results?.data?.reduce((acc, tag) => acc + (tag.articles_count || 0), 0) || 0}</p>
                    </div>
                </div>

                {/* Table */}
                <InertiaTableWrapper
                    resource={tags}
                    emptyState={{
                        title: 'No tags found',
                        description: 'Get started by creating your first tag to organize your content.',
                        icons: [TagsIcon, Tag, Plus],
                        action: {
                            label: 'Create Tag',
                            onClick: handleCreateTag,
                        },
                    }}
                    onCustomAction={handleCustomAction}
                />
            </div>
        </AppLayout>
    );
}
