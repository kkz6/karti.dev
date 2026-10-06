import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { SeoHead, type SeoData } from '../components/SeoHead';
import { CodeGlyph, HomeGlyph, VisaGlyph } from '../components/illustrations';
import { useSpotlight } from '../components/useSpotlight';
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

interface Role {
    company: string;
    title: string;
    logo?: string;
    start: string;
    end: string;
}

interface HomeProps {
    articles: ArticleData[];
    featuredPhotos?: FeaturedPhoto[];
    roles?: Role[];
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

const EASE = [0.22, 1, 0.36, 1] as const;

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

const socials = [
    { href: 'https://x.com/ikkarti', label: '@ikkarti', icon: XIcon, name: 'X' },
    { href: 'https://github.com/kkz6', label: 'github', icon: GitHubIcon, name: 'GitHub' },
    { href: 'https://linkedin.com/in/ikkarti', label: 'linkedin', icon: LinkedInIcon, name: 'LinkedIn' },
];

function Hero() {
    const reduceMotion = useReducedMotion();

    const container = {
        hidden: {},
        visible: { transition: reduceMotion ? {} : { staggerChildren: 0.08, delayChildren: 0.05 } },
    };

    const item = {
        hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26 },
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.2 : 0.8, ease: EASE } },
    };

    return (
        <section className="relative overflow-hidden pt-6 pb-20">
            <Container className="relative">
                <motion.div variants={container} initial="hidden" animate="visible" className="max-w-3xl">
                    <div>
                        <motion.p variants={item} className="label-mono mb-8 flex items-center gap-2.5">
                            bangalore, india
                        </motion.p>

                        <motion.h1 variants={item} className="display-hero text-foreground">
                            Hi, I'm Karthick.
                            <br />
                            <span className="text-primary">I make things.</span>
                        </motion.h1>

                        <motion.p variants={item} className="prose-measure text-muted-foreground mt-10 text-lg leading-relaxed sm:text-xl">
                            I'm a developer and founder. This is a place for things I build, notes on what I learn, and photographs from along the
                            way.
                        </motion.p>

                        <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-sm">
                            <Link href="/about" className="text-primary decoration-primary/30 hover:decoration-primary underline underline-offset-4">
                                A little about me &rarr;
                            </Link>
                            <Link href="/projects" className="text-muted-foreground hover:text-primary transition-colors">
                                Things I've built &rarr;
                            </Link>
                        </motion.div>

                        <motion.div variants={item} className="mt-11 flex flex-wrap items-center gap-x-6 gap-y-3">
                            {socials.map(({ href, label, icon: Icon, name }) => (
                                <a
                                    key={href}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Follow on ${name}`}
                                    className="group text-muted-foreground hover:text-primary flex items-center gap-2 font-mono text-sm transition-colors duration-200"
                                >
                                    <Icon className="h-4 w-4 fill-current" />
                                    <span className="group-hover:border-primary/40 border-b border-transparent transition-colors duration-200">
                                        {label}
                                    </span>
                                </a>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            </Container>
        </section>
    );
}

function SectionHeading({
    index,
    id,
    eyebrow,
    title,
    action,
}: {
    index: string;
    id: string;
    eyebrow: string;
    title: string;
    action?: { href: string; label: string };
}) {
    return (
        <div className="border-border/60 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
            <div>
                <p className="label-mono mb-4 flex items-center gap-3">
                    <span className="text-primary/70" data-numeric>
                        {index}
                    </span>
                    <span aria-hidden="true" className="bg-primary/40 h-px w-6" />
                    {eyebrow}
                </p>
                <h2 id={id} className="display-3 text-foreground">
                    {title}
                </h2>
            </div>
            {action && (
                <Link href={action.href} className="group text-primary inline-flex items-center gap-1.5 font-mono text-sm">
                    {action.label}
                    <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                        &rarr;
                    </span>
                </Link>
            )}
        </div>
    );
}

const interests = [
    {
        title: 'Software',
        body: 'Most of my work lives on the web. I build with Laravel, React, and TypeScript.',
        Glyph: CodeGlyph,
    },
    {
        title: 'Homes and networks',
        body: 'Away from the browser, I tinker with local automation, sensors, and home networks.',
        Glyph: HomeGlyph,
    },
    {
        title: 'Travel and hosting',
        body: 'Travel paperwork, hosting guests in Madurai, and the small details of being somewhere new.',
        Glyph: VisaGlyph,
    },
];

function Interests() {
    return (
        <section className="mt-20 md:mt-28" aria-labelledby="interests-heading">
            <Container>
                <SectionHeading index="03" eyebrow="away from the page" title="Things I spend time on" id="interests-heading" />
                <Reveal className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-3 md:gap-10">
                    {interests.map(({ title, body, Glyph }) => (
                        <Reveal.Item key={title}>
                            <Glyph aria-hidden="true" className="text-primary/70 h-7 w-7" />
                            <h3 className="font-display text-foreground mt-4 text-xl font-semibold tracking-tight">{title}</h3>
                            <p className="text-muted-foreground mt-3 text-base leading-relaxed">{body}</p>
                        </Reveal.Item>
                    ))}
                </Reveal>
            </Container>
        </section>
    );
}

function PhotoCard({ photo, className, ...rest }: { photo: FeaturedPhoto; className?: string } & React.ComponentPropsWithoutRef<typeof Link>) {
    return (
        <Link
            href={photo.slug ? `/photography/${photo.slug}` : '/photography'}
            className={`group bg-muted ring-border/50 relative block overflow-hidden rounded-2xl ring-1 ${className ?? ''}`}
            {...rest}
        >
            <img
                src={photo.src}
                alt={photo.alt || photo.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-white">{photo.title}</h3>
                <p className="mt-1 font-mono text-xs text-white/70">View series &rarr;</p>
            </div>
        </Link>
    );
}

function Photography({ photos }: { photos: FeaturedPhoto[] }) {
    if (photos.length === 0) return null;

    return (
        <section className="mt-28 md:mt-36" aria-labelledby="photography-heading">
            <Container>
                <SectionHeading
                    index="02"
                    id="photography-heading"
                    eyebrow="through the lens"
                    title="Photography"
                    action={{ href: '/photography', label: 'View all' }}
                />
            </Container>

            <Container className="mt-10">
                <Reveal className={photos.length === 1 ? 'grid grid-cols-1' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
                    {photos.map((photo, index) => (
                        <Reveal.Item key={photo.slug ?? index}>
                            <PhotoCard photo={photo} className={photos.length === 1 ? 'h-[26rem] w-full' : 'h-80 w-full'} />
                        </Reveal.Item>
                    ))}
                </Reveal>
            </Container>
        </section>
    );
}

function ArticleRow({ article }: { article: ArticleData }) {
    const { onPointerMove } = useSpotlight<HTMLAnchorElement>();

    return (
        <Link
            href={`/articles/${article.slug}`}
            onPointerMove={onPointerMove}
            className="spotlight group grid grid-cols-1 gap-x-8 gap-y-3 rounded-2xl px-5 py-7 transition-colors duration-300 sm:grid-cols-[10rem_1fr] sm:px-7"
        >
            <time dateTime={article.date} className="text-muted-foreground font-mono text-xs tracking-[0.06em] sm:pt-1.5">
                {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
            </time>

            <div>
                <h3 className="font-display text-foreground group-hover:text-primary text-xl font-semibold tracking-[-0.02em] transition-colors duration-200">
                    {article.title}
                </h3>
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

function Writing({ articles }: { articles: ArticleData[] }) {
    return (
        <section className="mt-28 md:mt-36" aria-labelledby="writing-heading">
            <Container>
                <SectionHeading
                    index="01"
                    id="writing-heading"
                    eyebrow="latest writing"
                    title="Notes and essays"
                    action={articles.length > 0 ? { href: '/articles', label: 'All articles' } : undefined}
                />

                {articles.length > 0 ? (
                    <Reveal className="divide-border/60 border-border/60 divide-y border-b">
                        {articles.map((article) => (
                            <Reveal.Item key={article.slug} as="article">
                                <ArticleRow article={article} />
                            </Reveal.Item>
                        ))}
                    </Reveal>
                ) : (
                    <div className="border-border mt-10 rounded-3xl border border-dashed px-6 py-16 text-center">
                        <p className="font-display text-foreground text-lg font-semibold">Nothing published yet</p>
                        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
                            A space for notes on software, everyday experiments, and things I'm figuring out.
                        </p>
                    </div>
                )}
            </Container>
        </section>
    );
}

function Work({ roles }: { roles: Role[] }) {
    if (roles.length === 0) return null;

    return (
        <section className="mt-28 md:mt-36" aria-labelledby="work-heading">
            <Container>
                <SectionHeading index="04" id="work-heading" eyebrow="experience" title="Where I've worked" />

                <Reveal className="divide-border/60 border-border/60 divide-y border-b">
                    {roles.map((role) => (
                        <Reveal.Item key={`${role.company}-${role.start}`}>
                            <div className="flex items-center gap-4 py-6">
                                {role.logo ? (
                                    <img
                                        src={role.logo}
                                        alt=""
                                        className="bg-card ring-border/60 h-11 w-11 shrink-0 rounded-lg object-contain p-1.5 ring-1"
                                    />
                                ) : (
                                    <div
                                        aria-hidden="true"
                                        className="bg-card text-muted-foreground ring-border/60 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-mono text-sm ring-1"
                                    >
                                        {role.company.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0 flex-auto">
                                    <p className="font-display text-foreground text-base font-semibold tracking-[-0.01em]">{role.company}</p>
                                    <p className="text-muted-foreground mt-0.5 text-sm">{role.title}</p>
                                </div>
                                <p className="text-muted-foreground shrink-0 font-mono text-xs" data-numeric>
                                    {role.start} &ndash; {role.end}
                                </p>
                            </div>
                        </Reveal.Item>
                    ))}
                </Reveal>
            </Container>
        </section>
    );
}

export default function Home({ articles = [], featuredPhotos = [], roles = [], seo, jsonLd }: HomeProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <Hero />
            <Writing articles={articles} />
            <Photography photos={featuredPhotos} />
            <Interests />
            <Work roles={roles} />
        </PublicLayout>
    );
}
