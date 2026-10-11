import { Head, Link } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/components/ui/tooltip';
import AppLayout from '@shared/layouts/app-layout';
import { cn } from '@shared/lib/utils';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper, type Action, type TableConfig } from '@table/components';
import { FileText, PenTool, PlusSquare } from 'lucide-react';

interface Article {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: { value: 'draft' | 'published' | 'archived' };
    deleted_at?: string | null;
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
            <AdminPageContent>
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
                    cell={{
                        title: ({ item }) => {
                            const status = item.deleted_at ? 'Trashed' : item.status.value.charAt(0).toUpperCase() + item.status.value.slice(1);
                            return (
                                <div className="flex min-w-64 items-center gap-3 py-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                tabIndex={0}
                                                role="img"
                                                aria-label={status}
                                                className="focus-visible:outline-ring inline-flex size-5 shrink-0 items-center justify-center rounded focus-visible:outline-2"
                                            >
                                                <span
                                                    className={cn(
                                                        'size-2 rounded-full',
                                                        item.deleted_at
                                                            ? 'bg-destructive'
                                                            : item.status.value === 'published'
                                                              ? 'bg-emerald-500'
                                                              : item.status.value === 'draft'
                                                                ? 'bg-amber-500'
                                                                : 'bg-muted-foreground',
                                                    )}
                                                />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>{status}</TooltipContent>
                                    </Tooltip>
                                    {item.deleted_at ? (
                                        <span>{item.title}</span>
                                    ) : (
                                        <Link
                                            className="text-foreground hover:underline focus-visible:underline"
                                            href={route('admin.blog.edit', { blog: item._primary_key })}
                                        >
                                            {item.title}
                                        </Link>
                                    )}
                                </div>
                            );
                        },
                    }}
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
            </AdminPageContent>
        </AppLayout>
    );
}
