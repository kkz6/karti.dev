import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { SimpleAssetsField } from '@media/components/Field';
import { MediaAsset } from '@media/types/media';
import { SEOFields } from '@seo/components/SeoFields';
import { type SeoData } from '@seo/types/seo-schema';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Switch } from '@shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/lib/utils';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { useSlug } from '@shared/hooks/use-slug';
import { CalendarIcon, Save } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function Create({ categories }: { categories: Category[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Photography', href: route('admin.photography.index') },
        { title: 'Create Gallery', href: route('admin.photography.create') },
    ];

    const [activeTab, setActiveTab] = useState('main');
    const { handleTitleChange: handleSlugTitleChange } = useSlug();

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        description: '',
        image_ids: [] as string[],
        cover_image: '',
        categories: [] as number[],
        status: 'draft',
        featured: false,
        sort_order: 0,
        meta_title: '',
        meta_description: '',
        seo: {} as SeoData,
        published_at: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.photography.store'));
    };

    const handleTitleChange = (value: string) => {
        handleSlugTitleChange(
            value,
            data.slug,
            data.title,
            (title) => setData('title', title),
            (slug) => setData('slug', slug)
        );
    };

    const publishedDate = data.published_at ? new Date(data.published_at) : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Photo Gallery" />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight">Create Photo Gallery</h1>
                        <div className="flex items-center gap-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                onClick={submit}
                                form="gallery-form"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Creating...' : 'Create Gallery'}
                            </Button>
                        </div>
                    </div>

                    <form id="gallery-form" onSubmit={submit} className="mt-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="border-border text-foreground h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
                                <TabsTrigger 
                                    value="main"
                                    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Main
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="images"
                                    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Images
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="seo"
                                    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    SEO
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-6 grid gap-8 lg:grid-cols-6">
                                <div className="lg:col-span-4 min-w-0">
                                    <TabsContent value="main" className="mt-0 space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Basic Information</CardTitle>
                                                <CardDescription>Enter the basic details for the gallery</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="title">Title *</Label>
                                                    <Input
                                                        id="title"
                                                        value={data.title}
                                                        onChange={(e) => handleTitleChange(e.target.value)}
                                                        error={errors.title}
                                                        placeholder="Enter gallery title"
                                                        required
                                                    />
                                                    {errors.title && <div className="text-sm text-red-600">{errors.title}</div>}
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="slug">Slug *</Label>
                                                    <Input
                                                        id="slug"
                                                        value={data.slug}
                                                        onChange={(e) => setData('slug', e.target.value)}
                                                        error={errors.slug}
                                                        placeholder="gallery-slug"
                                                        required
                                                    />
                                                    <p className="text-sm text-muted-foreground">Used in URLs. Auto-generated from title.</p>
                                                    {errors.slug && <div className="text-sm text-red-600">{errors.slug}</div>}
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                        placeholder="Brief description of the gallery"
                                                        rows={4}
                                                    />
                                                    {errors.description && <div className="text-sm text-red-600">{errors.description}</div>}
                                                </div>

                                                <div className="grid gap-2">
                                                    <SimpleAssetsField
                                                        name="Cover Image"
                                                        data={data.cover_image ? [data.cover_image] : []}
                                                        config={{
                                                            folder: '/photography/covers',
                                                            max_files: 1,
                                                            mode: 'grid',
                                                            canEdit: true,
                                                            accept: 'image/*',
                                                        }}
                                                        onChange={(assets) => setData('cover_image', assets[0] || '')}
                                                        onError={(error) => console.error('Cover image error:', error)}
                                                    />
                                                    {errors.cover_image && <div className="text-sm text-red-600">{errors.cover_image}</div>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="images" className="mt-0 space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Gallery Images</CardTitle>
                                                <CardDescription>Add images to your photo gallery</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <SimpleAssetsField
                                                    name="Gallery Images"
                                                    data={data.image_ids}
                                                    config={{
                                                        folder: '/photography/galleries',
                                                        max_files: 50,
                                                        mode: 'grid',
                                                        canEdit: true,
                                                        accept: 'image/*',
                                                    }}
                                                    onChange={(assetIds) => setData('image_ids', assetIds)}
                                                    onError={(error) => console.error('Gallery images error:', error)}
                                                    required
                                                />
                                                {errors.image_ids && <div className="text-sm text-red-600">{errors.image_ids}</div>}
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {data.image_ids.length} image{data.image_ids.length !== 1 ? 's' : ''} selected
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="seo" className="mt-0 space-y-6">
                                        <SEOFields
                                            data={{
                                                seo: data.seo,
                                                meta_title: data.meta_title,
                                                meta_description: data.meta_description,
                                                slug: data.slug
                                            }}
                                            setData={(key, value) => {
                                                setData(key as any, value);
                                            }}
                                            errors={errors}
                                            showSlug={false}
                                        />
                                    </TabsContent>
                                </div>

                                {/* Sidebar - 2/6 */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Publishing</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="status">Status</Label>
                                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="published">Published</SelectItem>
                                                        <SelectItem value="archived">Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.status && <div className="text-sm text-red-600">{errors.status}</div>}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label>Publish Date</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !publishedDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {publishedDate ? (
                                                                format(publishedDate, "PPP")
                                                            ) : (
                                                                <span>Pick a publish date</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={publishedDate}
                                                            onSelect={(date) => setData('published_at', date ? format(date, 'yyyy-MM-dd HH:mm:ss') : '')}
                                                            initialFocus
                                                        />
                                                        {publishedDate && (
                                                            <div className="p-3 border-t">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full"
                                                                    onClick={() => setData('published_at', '')}
                                                                >
                                                                    Clear date
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.published_at && <div className="text-sm text-red-600">{errors.published_at}</div>}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Organization</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="categories">Category</Label>
                                                <Select 
                                                    value={data.categories[0]?.toString() || 'none'} 
                                                    onValueChange={(value) => setData('categories', value === 'none' ? [] : [parseInt(value)])}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.categories && <div className="text-sm text-red-600">{errors.categories}</div>}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch id="featured" checked={data.featured} onCheckedChange={(checked) => setData('featured', checked)} />
                                                <Label htmlFor="featured">Featured Gallery</Label>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="sort_order">Sort Order</Label>
                                                <Input
                                                    id="sort_order"
                                                    type="number"
                                                    min="0"
                                                    value={data.sort_order}
                                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                                />
                                                {errors.sort_order && <div className="text-sm text-red-600">{errors.sort_order}</div>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </Tabs>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}