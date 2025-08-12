import { Head } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Separator } from '@shared/components/ui/separator';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Calendar, Edit, Eye, Tag, User } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: User;
}

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
    meta_title?: string;
    meta_description?: string;
    category?: Category;
    tags?: Tag[];
    user?: User;
    comments?: Comment[];
}

export default function Show({ article }: { article: Article }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: article.title, href: route('admin.blog.show', article.id) },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
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
            <Head title={`View Article: ${article.title}`} />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{article.title}</h2>
                        <p className="text-muted-foreground">Article details and content.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <a href={route('admin.blog.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Articles
                            </a>
                        </Button>
                        <Button asChild>
                            <a href={route('admin.blog.edit', article.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Article
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        {/* Featured Image */}
                        {article.featured_image && (
                            <Card>
                                <CardContent className="p-0">
                                    <img
                                        src={article.featured_image}
                                        alt={article.title}
                                        className="h-64 w-full rounded-t-lg object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Article Content */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Content</CardTitle>
                                {article.excerpt && <CardDescription>{article.excerpt}</CardDescription>}
                            </CardHeader>
                            <CardContent>
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap">{article.content}</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SEO Information */}
                        {(article.meta_title || article.meta_description) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>SEO Information</CardTitle>
                                    <CardDescription>Search engine optimization settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {article.meta_title && (
                                        <div>
                                            <h4 className="mb-1 font-medium">Meta Title</h4>
                                            <p className="text-sm text-gray-600">{article.meta_title}</p>
                                        </div>
                                    )}
                                    {article.meta_description && (
                                        <div>
                                            <h4 className="mb-1 font-medium">Meta Description</h4>
                                            <p className="text-sm text-gray-600">{article.meta_description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Comments */}
                        {article.comments && article.comments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comments ({article.comments.length})</CardTitle>
                                    <CardDescription>Comments on this article.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {article.comments.map((comment) => (
                                            <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                                                <div className="mb-2 flex items-center space-x-2">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-medium">{comment.user.name}</span>
                                                    <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                                                </div>
                                                <p className="text-sm">{comment.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Article Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Article Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-sm">Status:</span>
                                    <Badge className={getStatusColor(article.status)}>
                                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                                    </Badge>
                                </div>

                                {article.user && (
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm">Author:</span>
                                        <span className="text-sm font-medium">{article.user.name}</span>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm">Created:</span>
                                    <span className="text-sm">{formatDate(article.created_at)}</span>
                                </div>

                                {article.published_at && (
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-sm">Published:</span>
                                        <span className="text-sm">{formatDate(article.published_at)}</span>
                                    </div>
                                )}

                                <Separator />

                                <div>
                                    <span className="text-sm font-medium">Slug:</span>
                                    <p className="font-mono text-sm text-gray-600">{article.slug}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category */}
                        {article.category && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge variant="outline" className="text-sm">
                                        {article.category.name}
                                    </Badge>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {article.tags.map((tag) => (
                                            <Badge key={tag.id} variant="secondary" className="text-xs">
                                                <Tag className="mr-1 h-3 w-3" />
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
