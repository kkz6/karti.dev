import { z } from 'zod';

// Base SEO schema
// Using .nullish() to accept both null and undefined values from backend
export const seoSchema = z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    author: z.string().nullish(),
    image: z.string().nullish(),
    canonical_url: z.string().nullish(),
    robots: z.string().nullish(),
    type: z.string().nullish(),
    locale: z.string().nullish(),
    site_name: z.string().nullish(),
    twitter_card: z.string().nullish(),
    twitter_site: z.string().nullish(),
    twitter_creator: z.string().nullish(),
}).nullish();

// Type inference
export type SeoData = z.infer<typeof seoSchema>;

// Extended SEO schema with meta fields for backward compatibility
export const extendedSeoSchema = z.object({
    seo: seoSchema,
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').nullish(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').nullish(),
});

export type ExtendedSeoData = z.infer<typeof extendedSeoSchema>;