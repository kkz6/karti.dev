import { Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@shared/types';
import { Edit, Folder, Plus, Trash2 } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    articles_count: number;
    created_at: string;
    updated_at: string;
}

export default function Index({ categories }: { categories: Category[] }) {
    const { props } = usePage<SharedData>();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Articles', href: route('admin.blog.index') },
        { title: 'Categories', href: route('admin.blog.categories.index') },
    ];

    const handleDelete = (category: Category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            // TODO: Implement delete functionality
            console.log('Delete category:', category.id);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blog Categories" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Blog Categories</h2>
                        <p className="text-muted-foreground">Manage your blog categories and organize your content.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button asChild>
                            <Link href={route('admin.blog.categories.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Category
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Card key={category.id} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Folder className="h-5 w-5 text-blue-500" />
                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                    </div>
                                    <Badge variant="secondary">{category.articles_count} articles</Badge>
                                </div>
                                <CardDescription className="text-sm">/{category.slug}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {category.description && <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{category.description}</p>}
                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground text-xs">Created {new Date(category.created_at).toLocaleDateString()}</p>
                                    <div className="flex items-center space-x-1">
                                        <Button size="sm" variant="ghost" asChild>
                                            <Link href={route('admin.blog.categories.edit', category.id)}>
                                                <Edit className="h-3 w-3" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(category)}
                                            disabled={category.articles_count > 0}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {categories.length === 0 && (
                    <div className="flex h-[400px] items-center justify-center">
                        <div className="text-center">
                            <Folder className="text-muted-foreground mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-medium">No categories found</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Get started by creating your first category.</p>
                            <Button asChild className="mt-4">
                                <Link href={route('admin.blog.categories.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Category
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
