import { Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Calendar, Edit, FileText, Tags as TagsIcon } from 'lucide-react';

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
    category?: {
        id: number;
        name: string;
        slug: string;
    };
}

export default function Show({ tag }: { tag: Tag }) {
    const { props } = usePage<SharedData>();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Articles', href: route('admin.blog.index') },
        { title: 'Tags', href: route('admin.blog.tags.index') },
        { title: tag.name, href: route('admin.blog.tags.show', tag.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tag: ${tag.name}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('admin.blog.tags.index')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Tags
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-2">
                            <div 
                                className="h-6 w-6 rounded-full border"
                                style={{ backgroundColor: tag.color || '#64748b' }}
                            />
                            <h1 className="text-3xl font-bold tracking-tight">{tag.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button asChild>
                            <Link href={route('admin.blog.tags.edit', tag.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Tag
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Tag Details */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        {/* Tag Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tag Information</CardTitle>
                                <CardDescription>Details about this tag</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div 
                                            className="h-4 w-4 rounded-full border"
                                            style={{ backgroundColor: tag.color || '#64748b' }}
                                        />
                                        <p className="text-lg font-medium">{tag.name}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Slug</label>
                                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">#{tag.slug}</p>
                                </div>
                                {tag.description && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                                        <p className="text-sm">{tag.description}</p>
                                    </div>
                                )}
                                {tag.color && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Color</label>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div 
                                                className="h-6 w-6 rounded border"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            <span className="text-sm font-mono">{tag.color}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tagged Articles */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Tagged Articles</CardTitle>
                                        <CardDescription>Articles using this tag</CardDescription>
                                    </div>
                                    <Badge variant="outline">
                                        {tag.articles?.length || 0} articles
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {tag.articles && tag.articles.length > 0 ? (
                                    <div className="space-y-4">
                                        {tag.articles.map((article) => (
                                            <div key={article.id} className="flex items-start justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <Link 
                                                            href={route('admin.blog.show', article.id)}
                                                            className="font-medium hover:underline"
                                                        >
                                                            {article.title}
                                                        </Link>
                                                        <Badge 
                                                            variant={
                                                                article.status === 'published' ? 'default' :
                                                                article.status === 'draft' ? 'secondary' : 'outline'
                                                            }
                                                        >
                                                            {article.status}
                                                        </Badge>
                                                        {article.category && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {article.category.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {article.excerpt && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {article.excerpt}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                                        {article.user && (
                                                            <span>By {article.user.name}</span>
                                                        )}
                                                        <span className="flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {new Date(article.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <TagsIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-medium">No articles found</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            This tag hasn't been used in any articles yet.
                                        </p>
                                        <Button asChild className="mt-4">
                                            <Link href={route('admin.blog.create')}>
                                                Create Article
                                            </Link>
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
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm">{new Date(tag.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                    <p className="text-sm">{new Date(tag.updated_at).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                                    <Link href={route('admin.blog.tags.edit', tag.id)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Tag
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                                    <Link href={route('admin.blog.create')}>
                                        <FileText className="h-4 w-4 mr-2" />
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
