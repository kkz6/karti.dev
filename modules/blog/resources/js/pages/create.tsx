import { ArticleForm } from '../components';
import type { Tag } from '../types';

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function Create({ categories, tags = [] }: { categories: Category[]; tags?: Tag[] }) {
    return <ArticleForm categories={categories} tags={tags} />;
}
