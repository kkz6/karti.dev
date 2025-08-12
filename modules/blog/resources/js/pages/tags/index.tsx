import { Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@shared/types';
import { Edit, Plus, Tags as TagsIcon, Trash2 } from 'lucide-react';

interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    articles_count: number;
    created_at: string;
    updated_at: string;
}

export default function Index({ tags }: { tags: Tag[] }) {
    const { props } = usePage<SharedData>();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Articles', href: route('admin.blog.index') },
        { title: 'Tags', href: route('admin.blog.tags.index') },
    ];

    const handleDelete = (tag: Tag) => {
        if (confirm(`Are you sure you want to delete "${tag.name}"?`)) {
            // TODO: Implement delete functionality
            console.log('Delete tag:', tag.id);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blog Tags" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Blog Tags</h2>
                        <p className="text-muted-foreground">Manage your blog tags and improve content discoverability.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button asChild>
                            <Link href={route('admin.blog.tags.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Tag
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {tags.map((tag) => (
                        <Card key={tag.id} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color || '#64748b' }} />
                                        <CardTitle className="text-base">{tag.name}</CardTitle>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {tag.articles_count}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">#{tag.slug}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tag.description && <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{tag.description}</p>}
                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground text-xs">{new Date(tag.created_at).toLocaleDateString()}</p>
                                    <div className="flex items-center space-x-1">
                                        <Button size="sm" variant="ghost" asChild>
                                            <Link href={route('admin.blog.tags.edit', tag.id)}>
                                                <Edit className="h-3 w-3" />
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(tag)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {tags.length === 0 && (
                    <div className="flex h-[400px] items-center justify-center">
                        <div className="text-center">
                            <TagsIcon className="text-muted-foreground mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-medium">No tags found</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Get started by creating your first tag.</p>
                            <Button asChild className="mt-4">
                                <Link href={route('admin.blog.tags.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Tag
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
