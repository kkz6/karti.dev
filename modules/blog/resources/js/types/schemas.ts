import { seoSchema } from '@seo/types/seo-schema';
import { z } from 'zod';

// Zod schema for article form validation
export const articleSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(255, 'Slug must be less than 255 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().nullish(),
    category_id: z.string().min(1, 'Category is required'),
    tags: z.array(z.number()).nullish(),
    status: z.enum(['draft', 'published', 'archived']),
    featured_image: z.array(z.any()).nullish(),
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').nullish(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').nullish(),
    seo: seoSchema,
    published_at: z.date().nullish(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;