import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { CategoryPicker } from '@shared/components/category-picker';
import { ContentEditorHeader, EditorErrorSummary, EditorPublishedControl, EditorViewLink } from '@shared/components/content-editor';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { PageContainer } from '@shared/components/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { useEditorSave } from '@shared/hooks/use-editor-save';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import type { BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Zod schema for tool form validation
const toolSchema = z.object({
    tool_category_id: z.string().min(1, 'Category is required'),
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    description: z.string().min(1, 'Description is required'),
    url: z.string().url('Must be a valid URL').nullish().or(z.literal('')),
    image: z.string().nullish(),
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
        { title: tool.title, href: route('admin.tools.edit', tool.id) },
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

    const { saving, save } = useEditorSave(form, route('admin.tools.index'));

    const onSubmit = (data: ToolFormData, event?: BaseSyntheticEvent) => {
        save('put', route('admin.tools.update', tool.id), data, event);
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
            <UnsavedChangesGuard dirty={form.formState.isDirty} />
            <PageContainer className="content-editor">
                <div className="w-full">
                    <ContentEditorHeader
                        title={form.watch('title') || 'New tool'}
                        status={form.watch('status')}
                        formId="tool-form"
                        processing={saving}
                        backHref={route('admin.tools.index')}
                        onDelete={handleDelete}
                    />
                    <EditorErrorSummary errors={form.formState.errors} />

                    <Form {...form}>
                        <form id="tool-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Content Grid */}
                            <div className="content-editor-grid">
                                {/* Left column - 4/6 */}
                                <div className="content-editor-main space-y-6">
                                    {/* Basic Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Basic Information</CardTitle>
                                            <CardDescription>Update the basic details for the tool</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
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
                                <div className="content-editor-aside space-y-6">
                                    <LocalTrafficCard />
                                    <EditorViewLink href={route('uses')} published={tool.status === 'active'} />
                                    <EditorPublishedControl
                                        value={form.watch('status')}
                                        publishedValue="active"
                                        draftValue="inactive"
                                        onChange={(value) => form.setValue('status', value, { shouldDirty: true })}
                                        disabled={saving}
                                        error={form.formState.errors.status?.message}
                                    />

                                    {/* Publishing Options */}
                                    <Card>
                                        <CardContent className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="tool_category_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category *</FormLabel>
                                                        <FormControl>
                                                            <CategoryPicker
                                                                {...field}
                                                                categories={categories}
                                                                createUrl={route('admin.tool-categories.store')}
                                                            />
                                                        </FormControl>
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
            </PageContainer>
        </AppLayout>
    );
}
