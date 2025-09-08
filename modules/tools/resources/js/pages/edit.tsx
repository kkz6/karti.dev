import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Zod schema for tool form validation
const toolSchema = z.object({
    tool_category_id: z.string().min(1, 'Category is required'),
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    description: z.string().min(1, 'Description is required'),
    url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    image: z.string().optional(),
    featured: z.boolean(),
    status: z.enum(['active', 'inactive']),
});

type ToolFormData = z.infer<typeof toolSchema>;

interface Tool {
    id: number;
    tool_category_id: number;
    title: string;
    description: string;
    url?: string;
    image?: string;
    featured: boolean;
    status: 'active' | 'inactive';
}

interface ToolCategory {
    id: number;
    name: string;
    slug: string;
}

export default function Edit({ tool, categories }: { tool: Tool; categories: ToolCategory[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tools', href: route('admin.tools.index') },
        { title: tool.title, href: route('admin.tools.show', tool.id) },
        { title: 'Edit', href: route('admin.tools.edit', tool.id) },
    ];


    const form = useForm<ToolFormData>({
        resolver: zodResolver(toolSchema),
        defaultValues: {
            tool_category_id: tool.tool_category_id.toString(),
            title: tool.title || '',
            description: tool.description || '',
            url: tool.url || '',
            image: tool.image || '',
            featured: tool.featured || false,
            status: tool.status || 'active',
        },
    });

    const onSubmit = (data: ToolFormData) => {
        router.put(route('admin.tools.update', tool.id), data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${tool.title}"?`)) {
            router.delete(route('admin.tools.destroy', tool.id), {
                onSuccess: () => {
                    // Redirect will be handled by the controller
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Tool: ${tool.title}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Tool</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="tool-form" disabled={form.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Updating...' : 'Update Tool'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('admin.tools.show', tool.id)}>Cancel</Link>
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="tool-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Content Grid */}
                            <div className="grid gap-8 lg:grid-cols-6">
                                {/* Left column - 4/6 */}
                                <div className="space-y-6 lg:col-span-4">
                                    {/* Basic Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Basic Information</CardTitle>
                                            <CardDescription>Update the basic details for the tool</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="tool_category_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category *</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a category" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {categories.map((category) => (
                                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                                        {category.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Title *</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Enter tool title" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description *</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} placeholder="Describe this tool..." rows={4} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="url"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>URL</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="https://example.com" type="url" />
                                                        </FormControl>
                                                        <FormDescription>External link to the tool</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right column - 2/6 */}
                                <div className="space-y-6 lg:col-span-2">
                                    {/* Publishing Options */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Publishing Options</CardTitle>
                                            <CardDescription>Control tool visibility</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Status</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="featured"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel>Featured Tool</FormLabel>
                                                            <FormDescription>Display this tool prominently</FormDescription>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </AppLayout>
    );
}
