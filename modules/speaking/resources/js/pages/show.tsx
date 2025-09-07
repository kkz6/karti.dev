import { Head, Link } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { Calendar, Edit, ExternalLink, MapPin, Mic } from 'lucide-react';

interface SpeakingEvent {
    id: number;
    title: string;
    slug: string;
    description: string;
    event_name: string;
    event_date?: string;
    event_type: 'conference' | 'podcast' | 'workshop' | 'webinar';
    location?: string;
    url?: string;
    cta_text: string;
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
}

export default function Show({ event }: { event: SpeakingEvent }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Speaking Events', href: route('admin.speaking.index') },
        { title: event.title, href: route('admin.speaking.show', event.id) },
    ];

    const eventTypeColors = {
        conference: 'primary',
        podcast: 'success',
        workshop: 'warning',
        webinar: 'info',
    };

    const statusColors = {
        draft: 'warning',
        published: 'success',
        archived: 'secondary',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.title} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                        <div className="text-muted-foreground mt-2 flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                                <Mic className="mr-1 h-4 w-4" />
                                {event.event_name}
                            </div>
                            {event.event_date && (
                                <div className="flex items-center">
                                    <Calendar className="mr-1 h-4 w-4" />
                                    {new Date(event.event_date).toLocaleDateString()}
                                </div>
                            )}
                            {event.location && (
                                <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" />
                                    {event.location}
                                </div>
                            )}
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                            <Badge variant={eventTypeColors[event.event_type] as any}>{event.event_type}</Badge>
                            <Badge variant={statusColors[event.status] as any}>{event.status}</Badge>
                            {event.featured && <Badge variant="default">Featured</Badge>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {event.url && (
                            <Button variant="outline" asChild>
                                <a href={event.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {event.cta_text}
                                </a>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={route('admin.speaking.edit', event.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Event
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
                                <p className="whitespace-pre-wrap">{event.description}</p>
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
                                    <p className="mt-1">{event.meta_title || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Meta Description</p>
                                    <p className="mt-1">{event.meta_description || 'Not set'}</p>
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
                                    <p className="mt-1 font-mono text-sm">{event.slug}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Event Type</p>
                                    <p className="mt-1 capitalize">{event.event_type}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">CTA Text</p>
                                    <p className="mt-1">{event.cta_text}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Created</p>
                                    <p className="mt-1 text-sm">{new Date(event.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Last Updated</p>
                                    <p className="mt-1 text-sm">{new Date(event.updated_at).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
