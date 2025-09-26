import { Head } from '@inertiajs/react';
import { ArticleContent } from '../../components/ArticleContent';
import { ArticleLayout } from '../../components/ArticleLayout';
import PublicLayout from '../../layouts/public-layout';

interface ArticleProps {
    article: {
        title: string;
        description: string;
        date: string;
        content: string;
        author?: string;
    };
}

export default function ArticleShow({ article }: ArticleProps) {
    return (
        <>
            <Head title={article.title} />
            <PublicLayout>
                <ArticleLayout article={article}>
                    <ArticleContent content={article.content} />
                </ArticleLayout>
            </PublicLayout>
        </>
    );
}
