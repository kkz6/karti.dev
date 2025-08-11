import { Head, Link } from '@inertiajs/react'
import PublicLayout from '../layouts/public-layout';
import { Container } from '../components/Container';
import { Card } from '@shared/components/ui/card';

interface Article {
  id: string;
  date: string;
  title: string;
  description: string;
  slug: string;
}

interface BlogProps {
  articles?: Article[];
}

function Article({ article }: { article: Article }) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3 p-6">
        <time className="relative z-10 order-first mb-3 flex items-center text-sm text-zinc-400 dark:text-zinc-500 md:hidden">
          {new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <h2 className="text-base font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          <Link href={`/blog/${article.slug}`} className="hover:text-teal-500">
            {article.title}
          </Link>
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {article.description}
        </p>
        <Link
          href={`/blog/${article.slug}`}
          className="relative z-10 mt-4 flex items-center text-sm font-medium text-teal-500"
        >
          Read article
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="ml-1 h-4 w-4 stroke-current"
          >
            <path
              d="M6.75 5.75 9.25 8l-2.5 2.25"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </Card>
      <time className="mt-1 hidden md:block relative z-10 order-first mb-3 flex items-center text-sm text-zinc-400 dark:text-zinc-500">
        {new Date(article.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </time>
    </article>
  );
}

export default function Blog({ articles = [] }: BlogProps) {
  // Sample articles for display
  const sampleArticles = articles.length > 0 ? articles : [
    {
      id: '1',
      date: '2024-01-15',
      title: 'Crafting a design system for a multiplanetary future',
      description: 'Most companies try to stay ahead of the curve when it comes to visual design, but for Planetaria we needed to create a brand that would still inspire us 100 years from now when humanity has spread across our entire solar system.',
      slug: 'crafting-design-system',
    },
    {
      id: '2',
      date: '2023-12-02',
      title: 'Introducing Animaginary: High performance web animations',
      description: 'When you\'re building a website for a company as ambitious as Planetaria, you need to make an impression. I wanted people to visit our website and see animations that looked more realistic than reality itself.',
      slug: 'introducing-animaginary',
    },
    {
      id: '3',
      date: '2023-09-05',
      title: 'Rewriting the cosmOS kernel in Rust',
      description: 'When we released the first version of cosmOS last year, it was written in Go. Go is a wonderful programming language, but it\'s been a while since I\'ve seen an article on the front page of Hacker News about rewriting some important tool in Go.',
      slug: 'rewriting-cosmos-kernel',
    },
  ];

  return (
    <PublicLayout>
      <Head title="Blog" />
      <Container className="mt-16 sm:mt-32">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            Writing on software design, company building, and the aerospace industry.
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order.
          </p>
        </header>
        <div className="mt-16 sm:mt-20">
          <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
            <div className="flex max-w-3xl flex-col space-y-16">
              {sampleArticles.map((article) => (
                <Article key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </PublicLayout>
  )
}