import { Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Calendar, Edit, FileText, Folder } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    articles?: Article[];
}

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    status: 'draft' | 'published' | 'archived';
    published_at?: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export default function Show({ category }: { category: Category }) {
    const { props } = usePage<SharedData>();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Articles', href: route('admin.blog.index') },
        { title: 'Categories', href: route('admin.blog.categories.index') },
        { title: category.name, href: route('admin.blog.categories.show', category.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Category: ${category.name}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('admin.blog.categories.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Categories
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-2">
                            <Folder className="h-6 w-6 text-blue-500" />
                            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button asChild>
                            <Link href={route('admin.blog.categories.edit', category.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Category
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Category Details */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        {/* Category Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Information</CardTitle>
                                <CardDescription>Details about this category</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Name</label>
                                    <p className="text-lg font-medium">{category.name}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Slug</label>
                                    <p className="bg-muted rounded px-2 py-1 font-mono text-sm">/{category.slug}</p>
                                </div>
                                {category.description && (
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Description</label>
                                        <p className="text-sm">{category.description}</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Status</label>
                                        <div className="mt-1">
                                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Sort Order</label>
                                        <p className="text-sm font-medium">{category.sort_order}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Articles */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Recent Articles</CardTitle>
                                        <CardDescription>Latest articles in this category</CardDescription>
                                    </div>
                                    <Badge variant="outline">{category.articles?.length || 0} articles</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {category.articles && category.articles.length > 0 ? (
                                    <div className="space-y-4">
                                        {category.articles.map((article) => (
                                            <div key={article.id} className="flex items-start justify-between rounded-lg border p-4">
                                                <div className="flex-1">
                                                    <div className="mb-2 flex items-center space-x-2">
                                                        <FileText className="text-muted-foreground h-4 w-4" />
                                                        <Link href={route('admin.blog.show', article.id)} className="font-medium hover:underline">
                                                            {article.title}
                                                        </Link>
                                                        <Badge
                                                            variant={
                                                                article.status === 'published'
                                                                    ? 'default'
                                                                    : article.status === 'draft'
                                                                      ? 'secondary'
                                                                      : 'outline'
                                                            }
                                                        >
                                                            {article.status}
                                                        </Badge>
                                                    </div>
                                                    {article.excerpt && (
                                                        <p className="text-muted-foreground line-clamp-2 text-sm">{article.excerpt}</p>
                                                    )}
                                                    <div className="text-muted-foreground mt-2 flex items-center space-x-4 text-xs">
                                                        {article.user && <span>By {article.user.name}</span>}
                                                        <span className="flex items-center">
                                                            <Calendar className="mr-1 h-3 w-3" />
                                                            {new Date(article.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <FileText className="text-muted-foreground mx-auto h-12 w-12" />
                                        <h3 className="mt-4 text-lg font-medium">No articles found</h3>
                                        <p className="text-muted-foreground mt-2 text-sm">This category doesn't have any articles yet.</p>
                                        <Button asChild className="mt-4">
                                            <Link href={route('admin.blog.create')}>Create Article</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Created</label>
                                    <p className="text-sm">{new Date(category.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
                                    <p className="text-sm">{new Date(category.updated_at).toLocaleDateString()}</p>
                                </div>
                                {category.color && (
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Color</label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <div className="h-4 w-4 rounded border" style={{ backgroundColor: category.color }} />
                                            <span className="font-mono text-sm">{category.color}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                                    <Link href={route('admin.blog.categories.edit', category.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Category
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                                    <Link href={route('admin.blog.create')}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Create Article
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
