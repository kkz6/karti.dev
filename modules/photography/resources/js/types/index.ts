import type { SeoData } from '@seo/types/seo-schema';
/**
 * Common types for the Photography module
 */

import { type TableConfig } from '@table/components';

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface Photo {
    id: number;
    title?: string;
    image_path: string;
    alt_text?: string;
    sort_order: number;
    width?: number;
    height?: number;
    file_size?: number;
}

export interface PhotoGallery {
    seo?: SeoData;
    id: number;
    title: string;
    slug: string;
    description?: string;
    image_ids: number[];
    cover_image?: string;
    status: 'draft' | 'published' | 'archived';
    featured: boolean;
    sort_order: number;
    meta_title?: string;
    meta_description?: string;
    published_at?: string;
    created_at?: string;
    updated_at?: string;
    categories?: Category[];
    image_count?: number;
    _primary_key?: number;
}

export interface PhotoCollection extends PhotoGallery {
    photos?: Photo[];
}

export interface PhotoGalleryFormData {
    title: string;
    slug: string;
    description: string;
    image_ids: string[];
    cover_image: string;
    categories: number[];
    status: 'draft' | 'published' | 'archived';
    featured: boolean;
    sort_order: number;
    meta_title: string;
    meta_description: string;
    seo: NonNullable<SeoData>;
    published_at: string;
    photo_id: number | null;
}

// Page Props interfaces
export interface PhotoGalleryCreateEditPageProps {
    categories: Category[];
    photo?: PhotoGallery;
}

export interface PhotoGalleryIndexPageProps {
    photos: TableConfig<PhotoGallery>;
    categories: Category[];
}

export interface PhotoGalleryShowPageProps {
    collection: PhotoCollection;
}
