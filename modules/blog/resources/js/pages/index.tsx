import { Head } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
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
        if (onFinish) onFinish();
    };

    const handleCreateArticle = () => {
        window.location.href = route('admin.blog.create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blog Management" />
            <div className="content-index flex flex-col gap-8">
                <IndexHeader
                    title="Articles"
                    icon={FileText}
                    actions={
                        <Button onClick={handleCreateArticle} disabled={categories.length === 0}>
                            Create article
                        </Button>
                    }
                />

                <LocalTrafficCard compact />
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
