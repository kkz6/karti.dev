import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Globe, Image } from 'lucide-react';

interface SeoData {
    title?: string;
    description?: string;
    author?: string;
    image?: string;
    canonical_url?: string;
    robots?: string;
    type?: string;
    locale?: string;
    site_name?: string;
    twitter_card?: string;
    twitter_site?: string;
    twitter_creator?: string;
}

interface SEOFieldsProps {
    data: {
        seo?: SeoData;
        slug?: string;
        meta_title?: string;
        meta_description?: string;
        title?: string;  // Add title to generate slug from
    };
    setData: (key: string, value: any) => void;
    errors: any;
    showSlug?: boolean;
    slugLabel?: string;
    slugDescription?: string;
    originalSlug?: string;  // For tracking if slug was manually edited
}

export function SEOFields({ data, setData, errors, showSlug = true, slugLabel = 'Slug', slugDescription = 'Used in URLs', originalSlug }: SEOFieldsProps) {
    const updateSeoData = (field: string, value: string) => {
        const currentSeo = data.seo || {};
        setData('seo', {
            ...currentSeo,
            [field]: value,
        });
    };

    // Fallback to old meta fields for backward compatibility
    const seoTitle = data.seo?.title || data.meta_title || '';
    const seoDescription = data.seo?.description || data.meta_description || '';
    const seoImage = data.seo?.image || '';

    // Get site domain for preview
    const siteDomain = window.location.hostname || 'yoursite.com';
    const baseUrl = window.location.origin || `https://${siteDomain}`;
    const siteUrl = data.slug ? `${baseUrl}/blog/${data.slug}` : `${baseUrl}/blog/your-article-url`;

    return (
        <div className="space-y-6">
            {/* SEO Settings Card */}
        <Card>
            <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your content for search engines and social media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        placeholder="SEO title for search engines"
                        className={errors['seo.title'] ? 'border-red-500' : ''}
                        maxLength={60}
                    />
                    {errors['seo.title'] && <p className="mt-1 text-sm text-red-500">{errors['seo.title']}</p>}
                    <p className="text-muted-foreground mt-1 text-sm">{seoTitle.length}/60 characters</p>
                </div>

                <div>
                    <Label htmlFor="seo_description">Meta Description</Label>
                    <Textarea
                        id="seo_description"
                        value={seoDescription}
                        onChange={(e) => updateSeoData('description', e.target.value)}
                        placeholder="Brief description for search engine results"
                        rows={3}
                        className={errors['seo.description'] ? 'border-red-500' : ''}
                        maxLength={160}
                    />
                    {errors['seo.description'] && <p className="mt-1 text-sm text-red-500">{errors['seo.description']}</p>}
                    <p className="text-muted-foreground mt-1 text-sm">{seoDescription.length}/160 characters</p>
                </div>

                <div>
                    <Label htmlFor="seo_image">Social Media Image</Label>
                    <Input
                        id="seo_image"
                        value={data.seo?.image || ''}
                        onChange={(e) => updateSeoData('image', e.target.value)}
                        placeholder="URL to image for social media sharing"
                        className={errors['seo.image'] ? 'border-red-500' : ''}
                    />
                    {errors['seo.image'] && <p className="mt-1 text-sm text-red-500">{errors['seo.image']}</p>}
                    <p className="text-muted-foreground mt-1 text-sm">Recommended: 1200x630px</p>
                </div>

                <div>
                    <Label htmlFor="seo_author">Author</Label>
                    <Input
                        id="seo_author"
                        value={data.seo?.author || ''}
                        onChange={(e) => updateSeoData('author', e.target.value)}
                        placeholder="Content author name"
                        className={errors['seo.author'] ? 'border-red-500' : ''}
                    />
                    {errors['seo.author'] && <p className="mt-1 text-sm text-red-500">{errors['seo.author']}</p>}
                </div>

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
            </CardContent>
        </Card>

        {/* SEO Preview Card */}
        <Card>
            <CardHeader>
                <CardTitle>Search Engine Preview</CardTitle>
                <CardDescription>How your content will appear in search results</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Google Search Preview */}
                    <div className="rounded-lg border bg-white p-4">
                        <div className="space-y-2">
                            <div className="flex items-start space-x-3">
                                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                                    <Globe className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="text-xs text-gray-600">{siteDomain}</div>
                                    <div className="text-xs text-gray-500">
                                        {siteUrl.length > 60 ? siteUrl.substring(0, 57) + '...' : siteUrl}
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl text-blue-600 hover:underline">
                                {seoTitle || 'Page Title - Your Site Name'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {seoDescription || 'Page description will appear here. This is what users will see in search results.'}
                            </p>
                        </div>
                    </div>

                    {/* Social Media Preview */}
                    {(seoImage || seoTitle || seoDescription) && (
                        <div className="mt-4">
                            <h4 className="mb-2 text-sm font-medium text-gray-700">Social Media Preview</h4>
                            <div className="overflow-hidden rounded-lg border">
                                {seoImage ? (
                                    <img
                                        src={seoImage}
                                        alt="Social preview"
                                        className="h-48 w-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`${seoImage ? 'hidden' : ''} flex h-48 items-center justify-center bg-gray-100`}>
                                    <div className="text-center">
                                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500">No image selected</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3">
                                    <div className="text-xs uppercase text-gray-500">{siteDomain}</div>
                                    <h3 className="mt-1 font-semibold text-gray-900">
                                        {seoTitle || 'Page Title'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {seoDescription?.substring(0, 100) || 'Page description...'}
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
