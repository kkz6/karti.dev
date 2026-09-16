import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@shared/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { resolveSeoPreview } from '@shared/lib/site-metadata';
import type { SharedData } from '@shared/types';
import { Image } from 'lucide-react';

import type { SeoData } from '@seo/types/seo-schema';

interface SEOFieldsProps {
    data: {
        seo?: SeoData;
        slug?: string;
        meta_title?: string | null;
        meta_description?: string | null;
        title?: string; // Add title to generate slug from
    };
    setData: (key: string, value: string | Record<string, unknown>) => void;
    errors: Record<string, unknown>;
    showSlug?: boolean;
    slugLabel?: string;
    slugDescription?: string;
    fallbackTitle?: string; // Fallback title from parent (e.g., article title)
    fallbackDescription?: string | null; // Fallback description from parent (e.g., article excerpt)
    fallbackImage?: string; // Fallback image URL from parent (e.g., featured image)
    metadataOnly?: boolean;
    previewPath?: string;
}

export function SEOFields({
    data,
    setData,
    errors: validationErrors,
    showSlug = true,
    slugLabel = 'Slug',
    slugDescription = 'Used in URLs',
    fallbackTitle = '',
    fallbackDescription = '',
    fallbackImage = '',
    metadataOnly = false,
    previewPath,
}: SEOFieldsProps) {
    const { site, ziggy } = usePage<SharedData>().props;
    const errors: Record<string, string> = {};
    for (const key of ['slug', 'seo.title', 'seo.description', 'seo.author', 'seo.robots']) {
        const parts = key.split('.');
        const nested = validationErrors[parts[0]];
        const raw =
            validationErrors[key] ??
            (nested && typeof nested === 'object' ? (nested as Record<string, unknown>)[parts[1]] : undefined) ??
            validationErrors[key === 'seo.title' ? 'meta_title' : key === 'seo.description' ? 'meta_description' : key];
        const message = typeof raw === 'string' ? raw : raw && typeof raw === 'object' && 'message' in raw ? raw.message : undefined;
        if (typeof message === 'string') errors[key] = message;
    }
    const updateSeoData = (field: string, value: string) => {
        if (metadataOnly) {
            setData(field === 'title' ? 'meta_title' : 'meta_description', value);
            return;
        }
        const currentSeo = data.seo || {};
        setData('seo', {
            ...currentSeo,
            [field]: value,
        });
    };

    // Actual SEO field values (what's stored in the SEO fields)
    const seoTitle = data.seo?.title || data.meta_title || '';
    const seoDescription = data.seo?.description || data.meta_description || '';

    // Preview values: use SEO values if set, otherwise fall back to parent values
    const {
        title: previewTitle,
        description: previewDescription,
        image: previewImage,
    } = resolveSeoPreview(
        site,
        { title: fallbackTitle || data.title, description: fallbackDescription, image: fallbackImage },
        { title: seoTitle, description: seoDescription, image: data.seo?.image },
    );

    // Get site domain for preview
    const baseUrl = ziggy.url;
    const siteDomain = new URL(baseUrl).hostname;
    const siteUrl = previewPath
        ? new URL(previewPath, baseUrl).href
        : data.slug
          ? `${baseUrl}/articles/${data.slug}`
          : `${baseUrl}/articles/your-article-url`;

    return (
        <div className="space-y-6">
            {/* SEO Settings Card */}
            <Card className="content-editor-card">
                <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Optimize your content for search engines and social media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 [&>div]:space-y-2">
                    {showSlug && data.slug !== undefined && (
                        <div>
                            <Label htmlFor="slug">{slugLabel} *</Label>
                            <Input
                                id="slug"
                                value={data.slug || ''}
                                onChange={(e) => setData('slug', e.target.value)}
                                placeholder="url-friendly-slug"
                                className={errors.slug ? 'border-red-500' : ''}
                            />
                            {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                            {slugDescription && <p className="text-muted-foreground mt-1 text-sm">{slugDescription}</p>}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="seo_title">Meta Title</Label>
                        <Input
                            id="seo_title"
                            value={seoTitle}
                            onChange={(e) => updateSeoData('title', e.target.value)}
                            placeholder={fallbackTitle || data.title || site.title}
                            aria-invalid={!!errors['seo.title']}
                            aria-describedby={errors['seo.title'] ? 'seo-title-error' : undefined}
                            maxLength={60}
                        />
                        {errors['seo.title'] && (
                            <p id="seo-title-error" className="mt-1 text-sm text-red-500">
                                {errors['seo.title']}
                            </p>
                        )}
                        <p className="text-muted-foreground mt-1 text-sm">
                            {previewTitle.length}/60 characters
                            {!seoTitle && fallbackTitle && <span className="ml-1">(using entry title)</span>}
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="seo_description">Meta Description</Label>
                        <Textarea
                            id="seo_description"
                            value={seoDescription}
                            onChange={(e) => updateSeoData('description', e.target.value)}
                            placeholder={fallbackDescription || site.description || 'Brief description for search engine results'}
                            rows={3}
                            className={errors['seo.description'] ? 'border-red-500' : ''}
                            maxLength={160}
                        />
                        {errors['seo.description'] && <p className="mt-1 text-sm text-red-500">{errors['seo.description']}</p>}
                        <p className="text-muted-foreground mt-1 text-sm">
                            {previewDescription.length}/160 characters
                            {!seoDescription && fallbackDescription && <span className="ml-1">(using entry description)</span>}
                        </p>
                    </div>

                    {!metadataOnly && (
                        <div>
                            <Label htmlFor="seo_author">Author</Label>
                            <Input
                                id="seo_author"
                                value={data.seo?.author || ''}
                                onChange={(e) => updateSeoData('author', e.target.value)}
                                placeholder={site.author}
                                className={errors['seo.author'] ? 'border-red-500' : ''}
                            />
                            {errors['seo.author'] && <p className="mt-1 text-sm text-red-500">{errors['seo.author']}</p>}
                        </div>
                    )}

                    {!metadataOnly && (
                        <div>
                            <Label htmlFor="seo_robots">Robots</Label>
                            <Input
                                id="seo_robots"
                                value={data.seo?.robots || ''}
                                onChange={(e) => updateSeoData('robots', e.target.value)}
                                placeholder="index,follow"
                                className={errors['seo.robots'] ? 'border-red-500' : ''}
                            />
                            {errors['seo.robots'] && <p className="mt-1 text-sm text-red-500">{errors['seo.robots']}</p>}
                            <p className="text-muted-foreground mt-1 text-sm">Leave empty for default (index,follow)</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SEO Preview Card */}
            <Card className="content-editor-card">
                <CardHeader>
                    <CardTitle>Search Engine Preview</CardTitle>
                    <CardDescription>How your content will appear in search results</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Google Search Preview */}
                        <div className="bg-background rounded-lg border p-4">
                            <div className="space-y-2">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-muted mt-1 flex size-7 shrink-0 items-center justify-center rounded-full">
                                        <AppLogoIcon className="size-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-muted-foreground text-xs">{site.name}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {siteUrl.length > 60 ? siteUrl.substring(0, 57) + '...' : siteUrl}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-xl text-blue-600 hover:underline dark:text-blue-300">{previewTitle}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {previewDescription || 'Add a description for this page or set a default in Site settings.'}
                                </p>
                            </div>
                        </div>

                        {/* Social Media Preview - Twitter/Facebook Card Style */}
                        {(previewImage || previewTitle || previewDescription) && (
                            <div className="mt-4">
                                <h4 className="text-foreground mb-2 text-sm font-medium">Social Media Preview</h4>
                                <div className="border-border bg-background max-w-md overflow-hidden rounded-xl border shadow-sm">
                                    {/* Image Container */}
                                    {previewImage ? (
                                        <div
                                            className="h-52 w-full bg-cover bg-center bg-no-repeat"
                                            style={{ backgroundImage: `url(${previewImage})` }}
                                            role="img"
                                            aria-label="Social preview"
                                        />
                                    ) : (
                                        <div className="bg-muted flex h-40 w-full items-center justify-center">
                                            <div className="text-center">
                                                <Image className="text-muted-foreground mx-auto h-12 w-12" />
                                                <p className="text-muted-foreground mt-2 text-sm">Add a featured image</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Card Content */}
                                    <div className="p-3">
                                        <div className="text-muted-foreground text-xs tracking-wide uppercase">{siteDomain}</div>
                                        <h3 className="text-foreground mt-1 line-clamp-2 leading-tight font-semibold">{previewTitle}</h3>
                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-snug">
                                            {previewDescription?.substring(0, 100) || 'Page description...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
