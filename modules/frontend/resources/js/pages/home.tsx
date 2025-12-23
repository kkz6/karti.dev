import { Button } from '@shared/components/ui/button';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { SeoHead, type SeoData } from '../components/SeoHead';
import PublicLayout from '../layouts/public-layout';

interface ArticleData {
    slug: string;
    title: string;
    description: string;
    date: string;
}

interface FeaturedPhoto {
    src: string;
    alt: string;
    title: string;
    description: string;
    slug?: string;
}

interface HomeProps {
    articles: ArticleData[];
    featuredPhotos?: FeaturedPhoto[];
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path
                d="M2.75 7.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
                className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
            />
            <path d="m4 6 6.024 5.479a2.915 2.915 0 0 0 3.952 0L20 6" className="stroke-zinc-400 dark:stroke-zinc-500" />
        </svg>
    );
}


function GitHubIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.475 2 2 6.588 2 12.253c0 4.537 2.862 8.369 6.838 9.727.5.09.687-.218.687-.487 0-.243-.013-1.05-.013-1.91C7 20.059 6.35 18.957 6.15 18.38c-.113-.295-.6-1.205-1.025-1.448-.35-.192-.85-.667-.013-.68.788-.012 1.35.744 1.538 1.051.9 1.551 2.338 1.116 2.912.846.088-.666.35-1.115.638-1.371-2.225-.256-4.55-1.14-4.55-5.062 0-1.115.387-2.038 1.025-2.756-.1-.256-.45-1.307.1-2.717 0 0 .837-.269 2.75 1.051.8-.23 1.65-.346 2.5-.346.85 0 1.7.115 2.5.346 1.912-1.333 2.75-1.05 2.75-1.05.55 1.409.2 2.46.1 2.716.637.718 1.025 1.628 1.025 2.756 0 3.934-2.337 4.806-4.562 5.062.362.32.675.936.675 1.897 0 1.371-.013 2.473-.013 2.82 0 .268.188.589.688.486a10.039 10.039 0 0 0 4.932-3.74A10.447 10.447 0 0 0 22 12.253C22 6.588 17.525 2 12 2Z"
            />
        </svg>
    );
}


function LinkedInIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path d="M18.335 18.339H15.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.389 0-1.601 1.084-1.601 2.205v4.25h-2.666V9.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM7.003 8.575a1.546 1.546 0 01-1.548-1.549 1.548 1.548 0 111.547 1.549zm1.336 9.764H5.666V9.75H8.34v8.589zM19.67 3H4.329C3.593 3 3 3.58 3 4.297v15.406C3 20.42 3.594 21 4.328 21h15.338C20.4 21 21 20.42 21 19.703V4.297C21 3.58 20.4 3 19.666 3h.003z" />
        </svg>
    );
}

function XIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path d="M13.3174 10.7749L19.1457 4H17.7646L12.7039 9.88256L8.66193 4H4L10.1122 12.8955L4 20H5.38119L10.7254 13.7878L14.994 20H19.656L13.3171 10.7749H13.3174ZM11.4257 12.9738L10.8064 12.0881L5.87886 5.03974H8.00029L11.9769 10.728L12.5962 11.6137L17.7652 19.0075H15.6438L11.4257 12.9742V12.9738Z" />
        </svg>
    );
}

function SocialLink({
    icon: Icon,
    href,
    label,
    ...props
}: React.ComponentPropsWithoutRef<'a'> & {
    icon: React.ComponentType<{ className?: string }>;
    label?: string;
}) {
    return (
        <a
            className="group relative z-10 flex items-center gap-2 font-mono text-sm text-muted-foreground transition hover:text-primary"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        >
            <Icon className="h-5 w-5 fill-current" />
            {label && <span className="hidden sm:inline">{label}</span>}
        </a>
    );
}

function Article({ article }: { article: ArticleData }) {
    return (
        <Card as="article" href={`/articles/${article.slug}`}>
            <Card.Title href={`/articles/${article.slug}`}>
                {article.title}
            </Card.Title>
            <Card.Eyebrow as="time" decorate>
                {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Card.Eyebrow>
            <Card.Description>{article.description}</Card.Description>
            <Card.Cta>Read article</Card.Cta>
        </Card>
    );
}

function Newsletter() {
    return (
        <div className="terminal-window">
            <div className="terminal-window-header">
                <div className="terminal-window-dot red" />
                <div className="terminal-window-dot yellow" />
                <div className="terminal-window-dot green" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">subscribe.sh</span>
            </div>
            <form action="/thank-you" method="POST" className="p-6">
                <div className="font-mono text-sm">
                    <p className="text-muted-foreground">
                        <span className="text-primary">$</span> ./subscribe --notify
                    </p>
                    <p className="mt-2 text-foreground/80">
                        Get notified when I publish something new.
                    </p>
                </div>
                <div className="mt-6 flex items-center gap-2">
                    <span className="text-primary font-mono">{'>'}</span>
                    <input
                        type="email"
                        placeholder="email@example.com"
                        aria-label="Email address"
                        required
                        className="min-w-0 flex-auto appearance-none bg-transparent border-b border-border px-2 py-1.5 font-mono text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                    />
                    <Button type="submit" size="sm" className="font-mono">
                        Enter
                    </Button>
                </div>
            </form>
        </div>
    );
}


// Card Stack Component based on motion.dev
function CardStack({ featuredPhotos = [] }: { featuredPhotos?: FeaturedPhoto[] }) {
    // Use featured photos or fallback to default data
    const defaultCards = [
        {
            id: 1,
            title: "Latest Work",
            description: "Photography Portfolio",
            image: "/images/photos/image-1.jpg"
        },
        {
            id: 2,
            title: "Recent Project",
            description: "Web Development",
            image: "/images/photos/image-2.jpg"
        },
        {
            id: 3,
            title: "Speaking Event",
            description: "Tech Conference",
            image: "/images/photos/image-3.jpg"
        }
    ];

    const photoCards = featuredPhotos.length > 0
        ? featuredPhotos.slice(0, 3).map((photo, index) => ({
            id: index + 1,
            title: photo.title,
            description: photo.description,
            image: photo.src
        }))
        : defaultCards;

    const [cards, setCards] = useState(photoCards);

    // Update cards when featuredPhotos changes
    React.useEffect(() => {
        const newPhotoCards = featuredPhotos.length > 0
            ? featuredPhotos.slice(0, 3).map((photo, index) => ({
                id: index + 1,
                title: photo.title,
                description: photo.description,
                image: photo.src,
                slug: photo.slug || '' // Add slug for navigation
            }))
            : [];
        setCards(newPhotoCards);
    }, [featuredPhotos]);

    // Hide component if no featured photos
    if (featuredPhotos.length === 0) {
        return null;
    }

    const moveToBack = (id: number) => {
        setCards(prev => {
            const cardIndex = prev.findIndex(card => card.id === id);
            if (cardIndex === -1) return prev;

            const newCards = [...prev];
            const [movedCard] = newCards.splice(cardIndex, 1);
            newCards.push(movedCard);
            return newCards;
        });
    };

    return (
        <div className="relative h-80 w-full">
            {cards.map((card, index) => (
                <motion.div
                    key={card.id}
                    className="absolute inset-0 cursor-pointer"
                    style={{
                        zIndex: cards.length - index,
                    }}
                    animate={{
                        scale: 1 - index * 0.05,
                        y: index * -10,
                        rotate: index * 2,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                        if (Math.abs(info.offset.x) > 100) {
                            moveToBack(card.id);
                        }
                    }}
                    onClick={() => {
                        // Find the original photo data to get the slug
                        const originalPhoto = featuredPhotos.find(photo => photo.title === card.title);
                        if (originalPhoto?.slug) {
                            window.location.href = `/photography/${originalPhoto.slug}`;
                        }
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    }}
                >
                    <div className="h-full w-full rounded-2xl overflow-hidden shadow-xl bg-zinc-100 dark:bg-zinc-800 ring-1 ring-border/20">
                        <div className="relative h-full">
                            <img
                                src={card.image}
                                alt={card.title}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="text-xl font-display font-medium text-white">{card.title}</h3>
                                    <p className="mt-2 text-white/90 font-mono text-sm">{card.description}</p>
                                    <div className="mt-4 text-right">
                                        <div className="inline-block rounded-lg glass-subtle px-3 py-1 text-sm font-mono text-white">
                                            Swipe →
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export default function Home({ articles = [], featuredPhotos = [], seo, jsonLd }: HomeProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <Container className="mt-9">
                <div className="max-w-3xl">
                    <div className="font-mono text-sm text-muted-foreground mb-4">
                        <span className="text-primary">~</span> ./whoami
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
                        <span className="text-primary">{'{'}</span>
                        {' '}Developer, Speaker
                        <span className="text-primary">{' }'}</span>
                    </h2>
                    <div className="mt-8 font-mono text-sm leading-relaxed text-muted-foreground max-w-2xl">
                        <p className="flex">
                            <span className="text-primary mr-2 select-none">{'//'}</span>
                            <span>
                                I'm Karthick, a software designer and developer based in Bangalore, India.
                                I build technologies that empower people to explore the world on their own terms.
                            </span>
                        </p>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-4 sm:gap-6">
                        <SocialLink href="https://x.com/ikkarti" aria-label="Follow on X" icon={XIcon} label="@ikkarti" />
                        <SocialLink href="https://github.com/kkz6" aria-label="Follow on GitHub" icon={GitHubIcon} label="github" />
                        <SocialLink href="https://linkedin.com/in/ikkarti" aria-label="Follow on LinkedIn" icon={LinkedInIcon} label="linkedin" />
                    </div>
                </div>
            </Container>
            <Container className="mt-24 md:mt-28">
                <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
                    <div className="flex flex-col gap-16">
                        {articles.map((article) => (
                            <Article key={article.slug} article={article} />
                        ))}
                    </div>
                    <div className="space-y-10 lg:pl-16 xl:pl-24">
                        <CardStack featuredPhotos={featuredPhotos} />
                        <Newsletter />
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
