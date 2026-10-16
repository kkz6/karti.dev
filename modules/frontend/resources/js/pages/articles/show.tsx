import { ArticleContent } from '../../components/ArticleContent';
import { ArticleLayout } from '../../components/ArticleLayout';
import { type ArticlePreview } from '../../components/ScheduledArticleNotice';
import { SeoHead, type SeoData } from '../../components/SeoHead';
import PublicLayout from '../../layouts/public-layout';

interface ArticleProps {
    article: {
        title: string;
        description: string;
        date: string;
        content: string;
        preview?: ArticlePreview | null;
        author?: string;
        image?: {
            src: string;
            fullSrc: string;
            alt: string;
        } | null;
    };
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

export default function ArticleShow({ article, seo, jsonLd }: ArticleProps) {
    return (
        <>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <PublicLayout reading>
                <ArticleLayout article={article}>
                    <ArticleContent content={article.content} />
                </ArticleLayout>
            </PublicLayout>
        </>
    );
}
