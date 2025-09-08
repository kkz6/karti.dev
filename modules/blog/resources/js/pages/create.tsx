import { ArticleForm } from '../components';

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function Create({ categories }: { categories: Category[]; }) {
    return <ArticleForm categories={categories} />;
}
