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
        <Container className="mt-16 lg:mt-32">
            <div className="xl:relative">
                <div className="mx-auto max-w-2xl">
                    <Link
                        href="/articles"
                        aria-label="Go back to articles"
                        className="group glass-card hover:border-primary/30 mb-8 flex h-10 w-10 items-center justify-center rounded-xl transition lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0"
                    >
                        <ArrowLeftIcon className="stroke-muted-foreground group-hover:stroke-primary h-4 w-4 transition" />
                    </Link>
                    <article>
                        <header className="flex flex-col">
                            <time
                                dateTime={article.date}
                                className="text-muted-foreground order-first mb-5 flex items-center font-mono text-xs tracking-[0.06em]"
                            >
                                <span aria-hidden="true" className="bg-primary/50 h-4 w-0.5 rounded-full" />
                                <span className="ml-3">
                                    {new Date(article.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </time>
                            <h1 className="display-2 text-foreground">{article.title}</h1>
                            {article.description && <p className="text-muted-foreground mt-6 text-lg leading-relaxed">{article.description}</p>}
                            {article.image && (
                                <a
                                    href={article.image.fullSrc}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="border-border/60 bg-muted focus-visible:ring-ring mt-8 block overflow-hidden rounded-2xl border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                        <div className="border-border/60 prose prose-zinc dark:prose-invert prose-lg prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-img:rounded-xl mt-10 border-t pt-10">
                            {children}
                        </div>
                    </article>

                    <div className="border-border/60 mt-16 border-t pt-8">
                        <Link
                            href="/articles"
                            className="group text-muted-foreground hover:text-primary inline-flex items-center gap-2 font-mono text-sm transition-colors duration-200"
                        >
                            <ArrowLeftIcon className="h-4 w-4 stroke-current transition-transform duration-300 ease-out group-hover:-translate-x-1" />
                            All articles
                        </Link>
                    </div>
                </div>
            </div>
        </Container>
    );
}
