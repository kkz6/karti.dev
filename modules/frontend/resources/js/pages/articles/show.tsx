import { ArticleContent } from '../../components/ArticleContent';
import { ArticleLayout } from '../../components/ArticleLayout';
import { SeoHead, type SeoData } from '../../components/SeoHead';
import PublicLayout from '../../layouts/public-layout';

interface ArticleProps {
    article: {
        title: string;
        description: string;
        date: string;
        content: string;
        author?: string;
    };
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

export default function ArticleShow({ article, seo, jsonLd }: ArticleProps) {
    return (
        <>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <PublicLayout>
                <ArticleLayout article={article}>
                    <ArticleContent content={article.content} />
                </ArticleLayout>
            </PublicLayout>
        </>
    );
}
