import { Head, Link } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Edit, FileText, Trash2 } from 'lucide-react';

interface Article {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    published_at?: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    category?: {
        id: number;
        name: string;
        slug: string;
    };
}

interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    created_at: string;
    updated_at: string;
    articles?: Article[];
}

export default function Show({ tag }: { tag: Tag }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: 'Tags', href: route('admin.tags.index') },
        { title: tag.name, href: route('admin.tags.show', tag.id) },
    ];

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${tag.name}"?`)) {
            // TODO: Implement delete functionality using router.delete
            console.log('Delete tag:', tag.id);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tag: ${tag.name}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('admin.tags.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Tags
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: tag.color || '#64748b' }} />
                            <h1 className="text-3xl font-bold tracking-tight">{tag.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button asChild>
                            <Link href={route('admin.tags.edit', tag.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Tag
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        {/* Tag Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tag Information</CardTitle>
                                <CardDescription>Basic details about this tag</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Name</p>
                                        <p className="mt-1">{tag.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Slug</p>
                                        <p className="mt-1 font-mono text-sm">{tag.slug}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Created</p>
                                        <p className="mt-1">{new Date(tag.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Updated</p>
                                        <p className="mt-1">{new Date(tag.updated_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {tag.description && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Description</p>
                                        <p className="mt-1">{tag.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Articles with this tag */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Articles with this tag</CardTitle>
                                <CardDescription>Recent articles tagged with {tag.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tag.articles && tag.articles.length > 0 ? (
                                    <div className="space-y-4">
                                        {tag.articles.map((article) => (
                                            <div key={article.id} className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-medium">
                                                            <Link href={route('admin.blog.edit', article.id)} className="hover:underline">
                                                                {article.title}
                                                            </Link>
                                                        </h3>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(
                                                                article.status,
                                                            )}`}
                                                        >
                                                            {article.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground mt-1 text-sm">
                                                        by {article.user?.name} • {article.category?.name && <>in {article.category.name} • </>}
                                                        {new Date(article.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={route('admin.blog.edit', article.id)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No articles</h3>
                                        <p className="text-muted-foreground mt-1 text-sm">No articles have been tagged with {tag.name} yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tag Preview</CardTitle>
                                <CardDescription>How this tag appears</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted/50 flex items-center space-x-2 rounded-lg border p-3">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color || '#64748b' }} />
                                    <span className="font-medium">{tag.name}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Articles</span>
                                        <span className="font-medium">{tag.articles?.length || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                <CardDescription>Irreversible actions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Tag
                                </Button>
                                <p className="text-muted-foreground mt-2 text-xs">
                                    This action cannot be undone. The tag will be removed from all articles.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
