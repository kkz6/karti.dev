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
              <div className="order-first font-mono text-sm text-muted-foreground mb-4">
                <span className="text-primary">~</span> ./articles/<span className="text-primary">read</span>
              </div>
              <time
                dateTime={article.date}
                className="flex items-center text-sm font-mono text-muted-foreground mb-4"
              >
                <span className="h-4 w-0.5 rounded-full bg-primary/50" />
                <span className="ml-3">
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </time>
              <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
                {article.title}
              </h1>
            </header>
            <div className="mt-8 prose prose-zinc dark:prose-invert prose-headings:font-display prose-headings:font-medium prose-a:text-primary prose-code:font-mono">
              {children}
            </div>
          </article>
        </div>
      </div>
    </Container>
  )
}