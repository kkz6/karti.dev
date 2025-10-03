import { z } from 'zod';

// Base SEO schema
export const seoSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    author: z.string().optional(),
    image: z.string().optional(),
    canonical_url: z.string().optional(),
    robots: z.string().optional(),
    type: z.string().optional(),
    locale: z.string().optional(),
    site_name: z.string().optional(),
    twitter_card: z.string().optional(),
    twitter_site: z.string().optional(),
    twitter_creator: z.string().optional(),
}).optional();

// Type inference
export type SeoData = z.infer<typeof seoSchema>;

// Extended SEO schema with meta fields for backward compatibility
export const extendedSeoSchema = z.object({
    seo: seoSchema,
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').optional(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
});

export type ExtendedSeoData = z.infer<typeof extendedSeoSchema>;