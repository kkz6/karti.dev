import { ArticleForm } from '../components';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'published' | 'archived';
    featured_image?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    meta_title?: string;
    meta_description?: string;
    category?: Category;
    tags?: Tag[];
}

export default function Edit({ article, categories, tags }: { article: Article; categories: Category[]; tags: Tag[] }) {
    return <ArticleForm article={article} categories={categories} tags={tags} />;
}
