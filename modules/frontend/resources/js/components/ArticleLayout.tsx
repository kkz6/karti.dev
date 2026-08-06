import { Container } from './Container'
import { Link } from '@inertiajs/react'

function ArrowLeftIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArticleLayout({
  article,
  children,
}: {
  article: {
    title: string
    date: string
    description?: string
  }
  children: React.ReactNode
}) {
  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/articles"
            aria-label="Go back to articles"
            className="group mb-8 flex h-10 w-10 items-center justify-center rounded-xl glass-card transition hover:border-primary/30 lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0"
          >
            <ArrowLeftIcon className="h-4 w-4 stroke-muted-foreground transition group-hover:stroke-primary" />
          </Link>
          <article>
            <header className="flex flex-col">
              <time
                dateTime={article.date}
                className="order-first mb-5 flex items-center font-mono text-xs tracking-[0.06em] text-muted-foreground"
              >
                <span aria-hidden="true" className="h-4 w-0.5 rounded-full bg-primary/50" />
                <span className="ml-3">
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </time>
              <h1 className="display-2 text-foreground">
                {article.title}
              </h1>
              {article.description && (
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {article.description}
                </p>
              )}
            </header>
            <div className="mt-10 border-t border-border/60 pt-10 prose prose-zinc dark:prose-invert prose-lg prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-img:rounded-xl">
              {children}
            </div>
          </article>

          <div className="mt-16 border-t border-border/60 pt-8">
            <Link
              href="/articles"
              className="group inline-flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              <ArrowLeftIcon className="h-4 w-4 stroke-current transition-transform duration-300 ease-out group-hover:-translate-x-1" />
              All articles
            </Link>
          </div>
        </div>
      </div>
    </Container>
  )
}