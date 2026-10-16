import { Link } from '@inertiajs/react';
import { Reveal } from '../../components/Reveal';
import { ScheduledArticleNotice, type ArticlePreview } from '../../components/ScheduledArticleNotice';
import { SeoHead, type SeoData } from '../../components/SeoHead';
import { SimpleLayout } from '../../components/SimpleLayout';
import { useSpotlight } from '../../components/useSpotlight';
import PublicLayout from '../../layouts/public-layout';

interface Article {
    slug: string;
    title: string;
    description: string;
    date: string;
    preview?: ArticlePreview | null;
}

interface ArticlesProps {
    articles: Article[];
    seo?: SeoData;
}

function ArticleRow({ article }: { article: Article }) {
    const { onPointerMove } = useSpotlight<HTMLAnchorElement>();

    return (
        <Link
            href={`/articles/${article.slug}`}
            onPointerMove={onPointerMove}
            className="spotlight group grid grid-cols-1 gap-x-8 gap-y-3 rounded-2xl px-5 py-8 sm:grid-cols-[10rem_1fr] sm:px-7"
        >
            <time dateTime={article.date} className="text-muted-foreground font-mono text-xs tracking-[0.06em] sm:pt-1.5">
                {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                })}
            </time>

            <div>
                <ScheduledArticleNotice preview={article.preview} compact />
                <h2 className="font-display text-foreground group-hover:text-primary text-xl font-semibold tracking-[-0.02em] transition-colors duration-200">
                    {article.title}
                </h2>
                <p className="prose-measure text-muted-foreground mt-2.5 text-[0.9375rem] leading-relaxed">{article.description}</p>
                <span className="text-primary mt-4 inline-flex items-center gap-1.5 font-mono text-sm">
                    Read article
                    <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                        &rarr;
                    </span>
                </span>
            </div>
        </Link>
    );
}

export default function Articles({ articles = [], seo }: ArticlesProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} />
            <SimpleLayout
                eyebrow="writing"
                title="Notes on building software, and what I learn doing it."
                intro="Long-form thoughts on programming, product design, hardware, and the occasional detour — collected in chronological order."
            >
                {articles.length > 0 ? (
                    <Reveal className="divide-border/60 border-border/60 divide-y border-y">
                        {articles.map((article) => (
                            <Reveal.Item key={article.slug} as="article">
                                <ArticleRow article={article} />
                            </Reveal.Item>
                        ))}
                    </Reveal>
                ) : (
                    <div className="border-border rounded-2xl border border-dashed px-6 py-20 text-center">
                        <p className="text-primary font-mono text-sm">ls ./articles</p>
                        <p className="font-display text-foreground mt-4 text-xl font-semibold">Nothing published yet</p>
                        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed">
                            The first piece is in progress. Check back soon.
                        </p>
                    </div>
                )}
            </SimpleLayout>
        </PublicLayout>
    );
}
