import { Link } from '@inertiajs/react';
import { Container } from './Container';

function ArrowLeftIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
            <path d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ArticleLayout({
    article,
    children,
}: {
    article: {
        title: string;
        date: string;
        description?: string;
        image?: {
            src: string;
            fullSrc: string;
            alt: string;
        } | null;
    };
    children: React.ReactNode;
}) {
    return (
        <Container className="mt-10 sm:mt-16">
            <div className="article-reading mx-auto max-w-[44rem]">
                <Link
                    href="/articles"
                    className="text-muted-foreground hover:text-primary mb-6 inline-flex min-h-11 items-center gap-2 text-sm transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4 stroke-current" />
                    All articles
                </Link>
                <article>
                    <header>
                        <h1 className="article-title text-foreground font-semibold">{article.title}</h1>
                        <time dateTime={article.date} className="text-muted-foreground mt-4 block text-xs">
                            {new Date(article.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </time>
                        {article.description && <p className="article-intro mt-5">{article.description}</p>}
                        {article.image && (
                            <a
                                href={article.image.fullSrc}
                                target="_blank"
                                rel="noreferrer"
                                className="focus-visible:outline-primary mt-6 block overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
                                aria-label={`Open full-size image: ${article.image.alt}`}
                            >
                                <img
                                    src={article.image.src}
                                    alt={article.image.alt}
                                    className="aspect-[16/9] w-full object-cover"
                                    loading="eager"
                                    decoding="async"
                                />
                            </a>
                        )}
                    </header>
                    <div className="mt-8">{children}</div>
                </article>
                <div className="border-border/60 mt-10 border-t pt-5">
                    <Link
                        href="/articles"
                        className="text-muted-foreground hover:text-primary inline-flex min-h-11 items-center gap-2 text-sm transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 stroke-current" />
                        All articles
                    </Link>
                </div>
            </div>
        </Container>
    );
}
