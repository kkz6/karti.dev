import { Head, Link } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { Edit, ExternalLink, Globe } from 'lucide-react';

interface Tool {
    id: number;
    title: string;
    slug: string;
    description: string;
    url?: string;
    image?: string;
    featured: boolean;
    status: 'active' | 'inactive';
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
    category: {
        id: number;
        name: string;
        slug: string;
    };
}

export default function Show({ tool }: { tool: Tool }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tools', href: route('admin.tools.index') },
        { title: tool.title, href: route('admin.tools.show', tool.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={tool.title} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{tool.title}</h1>
                        <div className="mt-1 flex items-center space-x-2">
                            <Badge variant={tool.status === 'active' ? 'success' : 'secondary'}>{tool.status}</Badge>
                            {tool.featured && <Badge variant="default">Featured</Badge>}
                            <Badge variant="outline">{tool.category.name}</Badge>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {tool.url && (
                            <Button variant="outline" asChild>
                                <a href={tool.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Visit Tool
                                </a>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={route('admin.tools.edit', tool.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Tool
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{tool.description}</p>
                            </CardContent>
                        </Card>

                        {/* SEO Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Information</CardTitle>
                                <CardDescription>Search engine optimization details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Meta Title</p>
                                    <p className="mt-1">{tool.meta_title || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Meta Description</p>
                                    <p className="mt-1">{tool.meta_description || 'Not set'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Slug</p>
                                    <p className="mt-1 font-mono text-sm">{tool.slug}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Category</p>
                                    <p className="mt-1">{tool.category.name}</p>
                                </div>
                                {tool.url && (
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">External URL</p>
                                        <a
                                            href={tool.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 flex items-center text-sm text-blue-600 hover:underline"
                                        >
                                            <Globe className="mr-1 h-3 w-3" />
                                            {new URL(tool.url).hostname}
                                        </a>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Created</p>
                                    <p className="mt-1 text-sm">{new Date(tool.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Last Updated</p>
                                    <p className="mt-1 text-sm">{new Date(tool.updated_at).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
