import { Head, Link } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { Calendar, Edit, ExternalLink, Github, Globe, Star } from 'lucide-react';

interface Project {
    id: number;
    title: string;
    slug: string;
    description: string;
    short_description?: string;
    client?: string;
    project_url?: string;
    github_url?: string;
    technologies: string[];
    featured_image?: string;
    images: string[];
    start_date?: string;
    end_date?: string;
    status: 'draft' | 'published' | 'archived';
    featured: boolean;
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
}

export default function Show({ project }: { project: Project }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: route('admin.projects.index') },
        { title: project.title, href: route('admin.projects.show', project.id) },
    ];

    const statusColors = {
        draft: 'warning',
        published: 'success',
        archived: 'secondary',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.title} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                        {project.short_description && <p className="text-muted-foreground mt-2 text-lg">{project.short_description}</p>}
                        <div className="mt-2 flex items-center space-x-2">
                            <Badge variant={statusColors[project.status] as any}>{project.status}</Badge>
                            {project.featured && (
                                <Badge variant="default">
                                    <Star className="mr-1 h-3 w-3" />
                                    Featured
                                </Badge>
                            )}
                            {project.client && <Badge variant="outline">{project.client}</Badge>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {project.project_url && (
                            <Button variant="outline" asChild>
                                <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                                    <Globe className="mr-2 h-4 w-4" />
                                    View Live
                                </a>
                            </Button>
                        )}
                        {project.github_url && (
                            <Button variant="outline" asChild>
                                <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                                    <Github className="mr-2 h-4 w-4" />
                                    Source Code
                                </a>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={route('admin.projects.edit', project.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Project
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
                                <p className="whitespace-pre-wrap">{project.description}</p>
                            </CardContent>
                        </Card>

                        {/* Technologies */}
                        {project.technologies.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Technologies</CardTitle>
                                    <CardDescription>Technologies and tools used in this project</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {project.technologies.map((tech, index) => (
                                            <Badge key={index} variant="secondary">
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* SEO Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Information</CardTitle>
                                <CardDescription>Search engine optimization details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Meta Title</p>
                                    <p className="mt-1">{project.meta_title || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Meta Description</p>
                                    <p className="mt-1">{project.meta_description || 'Not set'}</p>
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
                                    <p className="mt-1 font-mono text-sm">{project.slug}</p>
                                </div>
                                {(project.start_date || project.end_date) && (
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Timeline</p>
                                        <div className="mt-1 flex items-center text-sm">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            {project.start_date && new Date(project.start_date).toLocaleDateString()}
                                            {project.start_date && project.end_date && ' - '}
                                            {project.end_date && new Date(project.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Created</p>
                                    <p className="mt-1 text-sm">{new Date(project.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Last Updated</p>
                                    <p className="mt-1 text-sm">{new Date(project.updated_at).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* External Links */}
                        {(project.project_url || project.github_url) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>External Links</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {project.project_url && (
                                        <a
                                            href={project.project_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-sm text-blue-600 hover:underline"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Live Project
                                        </a>
                                    )}
                                    {project.github_url && (
                                        <a
                                            href={project.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-sm text-blue-600 hover:underline"
                                        >
                                            <Github className="mr-2 h-4 w-4" />
                                            Source Code
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
