import { type SeoData } from '@seo/types/seo-schema';

export interface Article {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'published' | 'archived';
    featured_image?: number | string;
    featured_image_url?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    meta_title?: string;
    meta_description?: string;
    category_id?: number;
    category?: Category;
    tags?: Tag[];
    seo?: SeoData;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
}

export interface ArticleFormProps {
    article?: Article;
    categories: Category[];
    tags?: Tag[];
}
