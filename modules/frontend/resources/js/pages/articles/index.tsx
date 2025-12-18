import React from 'react';
import { Card } from '../../components/Card';
import { SeoHead, type SeoData } from '../../components/SeoHead';
import { SimpleLayout } from '../../components/SimpleLayout';
import PublicLayout from '../../layouts/public-layout';

interface Article {
    slug: string;
    title: string;
    description: string;
    date: string;
}

interface ArticlesProps {
    articles: Article[];
    seo?: SeoData;
}

function Article({ article }: { article: Article }) {
    return (
        <article className="md:grid md:grid-cols-4 md:items-baseline">
            <Card as="div" className="md:col-span-3" href={`/articles/${article.slug}`}>
                <Card.Title href={`/articles/${article.slug}`}>
                    {article.title}
                </Card.Title>
                <Card.Eyebrow as="time" dateTime={article.date} className="md:hidden" decorate>
                    {new Date(article.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Card.Eyebrow>
                <Card.Description>{article.description}</Card.Description>
                <Card.Cta>Read article</Card.Cta>
            </Card>
            <Card.Eyebrow as="time" dateTime={article.date} className="mt-1 hidden md:block">
                {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
            </Card.Eyebrow>
        </article>
    );
}

export default function Articles({ articles = [], seo }: ArticlesProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <PublicLayout>
                <SimpleLayout
                    title="Writing on software design, company building, and the aerospace industry."
                    intro="All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order."
                >
                    <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
                        <div className="flex max-w-3xl flex-col space-y-16">
                            {articles.length > 0 ? (
                                articles.map((article) => (
                                    <Article key={article.slug} article={article} />
                                ))
                            ) : (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    No articles published yet.
                                </p>
                            )}
                        </div>
                    </div>
                </SimpleLayout>
            </PublicLayout>
        </>
    );
}