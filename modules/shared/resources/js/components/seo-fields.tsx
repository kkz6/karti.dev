import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';

interface SEOFieldsProps {
    data: {
        meta_title?: string;
        meta_description?: string;
        slug: string;
    };
    setData: (key: string, value: string) => void;
    errors: Record<string, string>;
    showSlug?: boolean;
    slugLabel?: string;
    slugDescription?: string;
}

export function SEOFields({ data, setData, errors, showSlug = true, slugLabel = 'Slug', slugDescription = 'Used in URLs' }: SEOFieldsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your content for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {showSlug && (
                    <div>
                        <Label htmlFor="slug">{slugLabel} *</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="url-friendly-slug"
                            className={errors.slug ? 'border-red-500' : ''}
                        />
                        {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                        {slugDescription && <p className="text-muted-foreground mt-1 text-sm">{slugDescription}</p>}
                    </div>
                )}

                <div>
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                        id="meta_title"
                        value={data.meta_title || ''}
                        onChange={(e) => setData('meta_title', e.target.value)}
                        placeholder="SEO title for search engines"
                        className={errors.meta_title ? 'border-red-500' : ''}
                        maxLength={60}
                    />
                    {errors.meta_title && <p className="mt-1 text-sm text-red-500">{errors.meta_title}</p>}
                    <p className="text-muted-foreground mt-1 text-sm">{(data.meta_title || '').length}/60 characters</p>
                </div>

                <div>
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                        id="meta_description"
                        value={data.meta_description || ''}
                        onChange={(e) => setData('meta_description', e.target.value)}
                        placeholder="Brief description for search engine results"
                        rows={3}
                        className={errors.meta_description ? 'border-red-500' : ''}
                        maxLength={160}
                    />
                    {errors.meta_description && <p className="mt-1 text-sm text-red-500">{errors.meta_description}</p>}
                    <p className="text-muted-foreground mt-1 text-sm">{(data.meta_description || '').length}/160 characters</p>
                </div>
            </CardContent>
        </Card>
    );
}
