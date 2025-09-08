import { Head } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper, type Action, type TableConfig } from '@table/components';
import { FileText, PenTool, PlusSquare } from 'lucide-react';

interface Article {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'published' | 'archived';
    featured_image?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    category?: {
        id: number;
        name: string;
        slug: string;
    };
    tags?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    _primary_key: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function Index({ articles, categories }: { articles: TableConfig<Article>; categories: Category[] }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Blog Management', href: route('admin.blog.index') }];

    const handleCustomAction = async (action: Action, keys: (string | number)[], onFinish?: () => void) => {
        const articleId = typeof keys[0] === 'string' ? parseInt(keys[0]) : keys[0];
        const article = articles.results?.data?.find((item) => item._primary_key === articleId);

        if (article) {
            if (action.id === 'edit') {
                window.location.href = route('admin.blog.edit', { blog: article.slug });
            }
            if (action.id === 'show') {
                window.location.href = route('admin.blog.show', { blog: article.slug });
            }
        }

        if (onFinish) onFinish();
    };

    const handleCreateArticle = () => {
        window.location.href = route('admin.blog.create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blog Management" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateArticle} disabled={categories.length === 0}>
                            Create Article
                        </Button>
                    </div>
                </div>

                <InertiaTableWrapper
                    resource={articles}
                    emptyState={{
                        title: 'No articles found',
                        description: 'Get started by creating your first blog article.',
                        icons: [FileText, PenTool, PlusSquare],
                        action: {
                            label: 'Create Article',
                            onClick: handleCreateArticle,
                            disabled: categories.length === 0,
                        },
                    }}
                    onCustomAction={handleCustomAction}
                />
            </div>
        </AppLayout>
    );
}
