import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';

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
    };
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
    showSlug?: boolean;
    slugLabel?: string;
    slugDescription?: string;
}

export function SEOFields({ data, setData, errors, showSlug = true, slugLabel = 'Slug', slugDescription = 'Used in URLs' }: SEOFieldsProps) {
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

    return (
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
    );
}
