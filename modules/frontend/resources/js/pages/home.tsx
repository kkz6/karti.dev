import { Link } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { SeoHead, type SeoData } from '../components/SeoHead';
import { CodeGlyph, HeroDiagram, HomeGlyph, HouseScene, NetworkGlyph, VisaGlyph } from '../components/illustrations';
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
        <section className="relative overflow-hidden pb-20 pt-6">
            <Container className="relative">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 items-center gap-x-8 gap-y-14 lg:grid-cols-12"
                >
                    <div className="lg:col-span-7">
                    <motion.p variants={item} className="label-mono mb-8 flex items-center gap-2.5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                        bangalore, india &middot; open to consulting
                    </motion.p>

                    <motion.h1 variants={item} className="display-hero text-foreground">
                        Software,
                        <br />
                        smart homes,
                        <br />
                        <span className="relative inline-block text-primary">
                            smoother visas
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 300 12"
                                preserveAspectRatio="none"
                                className="absolute -bottom-1 left-0 h-[0.16em] w-full text-primary/40"
                            >
                                <path d="M2 8c60-5 120-6 180-3s90 4 116 1" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
                            </svg>
                        </span>
                    </motion.h1>

                    <motion.p variants={item} className="prose-measure mt-10 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        I'm Karthick — a developer and founder in Bangalore. I ship web products, consult on home
                        automation, networking and visa applications, and host guests on Airbnb.
                    </motion.p>

                    <motion.div variants={item} className="mt-11 flex flex-wrap items-center gap-3">
                        <Button asChild size="lg" className="rounded-full px-7 font-mono">
                            <Link href="/consulting">Work with me</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full px-7 font-mono">
                            <Link href="/projects">See my work</Link>
                        </Button>
                    </motion.div>

                    <motion.div variants={item} className="mt-11 flex flex-wrap items-center gap-x-6 gap-y-3">
                        {socials.map(({ href, label, icon: Icon, name }) => (
                            <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Follow on ${name}`}
                                className="group flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                            >
                                <Icon className="h-4 w-4 fill-current" />
                                <span className="border-b border-transparent transition-colors duration-200 group-hover:border-primary/40">
                                    {label}
                                </span>
                            </a>
                        ))}
                        </motion.div>
                    </div>

                    {/* Diagram sits in its own column so the composition reads as one block */}
                    <motion.div variants={item} className="hidden lg:col-span-5 lg:block">
                        <HeroDiagram className="h-auto w-full opacity-90 dark:opacity-80" />
                    </motion.div>
                </motion.div>
            </Container>
        </section>
    );
}

function SectionHeading({
    index,
    eyebrow,
    title,
    action,
}: {
    index: string;
    eyebrow: string;
    title: string;
    action?: { href: string; label: string };
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
            <div>
                <p className="label-mono mb-4 flex items-center gap-3">
                    <span className="text-primary/70" data-numeric>
                        {index}
                    </span>
                    <span aria-hidden="true" className="h-px w-6 bg-primary/40" />
                    {eyebrow}
                </p>
                <h2 className="display-3 text-foreground">{title}</h2>
            </div>
            {action && (
                <Link href={action.href} className="group inline-flex items-center gap-1.5 font-mono text-sm text-primary">
                    {action.label}
                    <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                        &rarr;
                    </span>
                </Link>
            )}
        </div>
    );
}

const capabilities = [
    {
        index: '01',
        title: 'Software',
        body: 'Product work end to end — Laravel and React, from database schema through to the interface people actually touch.',
        points: ['Web applications', 'APIs and integrations', 'Long-term maintenance'],
        meta: 'laravel · react · typescript',
        href: '/projects',
        Glyph: CodeGlyph,
    },
    {
        index: '02',
        title: 'Visa consultations',
        body: 'Visa applications fail on paperwork far more often than on eligibility. I help you find the right route and get the documents right first time.',
        points: ['Choosing a category', 'Document checklists', 'Timelines and appointments'],
        meta: 'categories · documents · timelines',
        href: '/consulting#visa',
        Glyph: VisaGlyph,
    },
    {
        index: '03',
        title: 'Home automation',
        body: 'Smart homes go wrong when the pieces do not talk to each other. I help you pick a stack that runs locally and stays easy to live with.',
        points: ['Platform and protocols', 'Lighting and sensors', 'Local-first fallbacks'],
        meta: 'local-first · sensors · lighting',
        href: '/consulting#home-automation',
        Glyph: HomeGlyph,
    },
    {
        index: '04',
        title: 'Networking',
        body: 'Most home and small-office wifi problems are layout problems, not hardware problems. I design networks that cover the space and stay fast.',
        points: ['Coverage and AP placement', 'VLANs and isolation', 'Remote access'],
        meta: 'coverage · vlans · remote access',
        href: '/consulting#networking',
        Glyph: NetworkGlyph,
    },
];

function CapabilityPanel({ capability, offset }: { capability: (typeof capabilities)[number]; offset: number }) {
    const { onPointerMove } = useSpotlight<HTMLAnchorElement>();
    const { Glyph } = capability;

    return (
        // Each panel sticks a little lower than the last, so they pile up on scroll
        <div className="sticky" style={{ top: `${7 + offset * 1.75}rem` }}>
            <Link
                href={capability.href}
                onPointerMove={onPointerMove}
                className="spotlight group relative block overflow-hidden rounded-3xl surface-elevated p-8 md:p-12"
            >
                <Glyph
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-16 -right-12 h-72 w-72 text-primary/[0.05] transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                    <div className="lg:col-span-1">
                        <span className="font-mono text-sm text-primary" data-numeric>
                            {capability.index}
                        </span>
                    </div>

                    <div className="lg:col-span-7">
                        <Glyph aria-hidden="true" className="h-9 w-9 text-primary" />
                        <h3 className="mt-6 font-display text-3xl font-semibold tracking-[-0.025em] text-foreground transition-colors duration-200 group-hover:text-primary md:text-4xl">
                            {capability.title}
                        </h3>
                        <p className="prose-measure mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                            {capability.body}
                        </p>
                        <span className="mt-7 inline-flex items-center gap-1.5 font-mono text-sm text-primary">
                            Learn more
                            <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                                &rarr;
                            </span>
                        </span>
                    </div>

                    <ul role="list" className="lg:col-span-4 lg:border-l lg:border-border/60 lg:pl-8">
                        {capability.points.map((point) => (
                            <li
                                key={point}
                                className="flex gap-3 border-b border-border/50 py-3 text-sm text-muted-foreground last:border-0"
                            >
                                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            </Link>
        </div>
    );
}

function Capabilities() {
    return (
        <section className="mt-24 md:mt-32" aria-labelledby="capabilities-heading">
            <Container>
                <SectionHeading
                    index="01"
                    eyebrow="what i do"
                    title="Four things, done properly"
                    action={{ href: '/consulting', label: 'Consulting' }}
                />
            </Container>

            <Container className="mt-10">
                <div className="space-y-6 pb-24">
                    {capabilities.map((capability, index) => (
                        <CapabilityPanel key={capability.title} capability={capability} offset={index} />
                    ))}
                </div>
            </Container>
        </section>
    );
}

// The stack this site and most of my client work runs on
const stack = [
    'Laravel',
    'PHP',
    'React',
    'TypeScript',
    'Inertia.js',
    'Tailwind CSS',
    'Vite',
    'MySQL',
    'Home Assistant',
    'Microcontrollers',
    'UniFi',
];

function StackMarquee() {
    const track = [...stack, ...stack];

    return (
        <section className="marquee full-bleed mt-24 overflow-hidden border-y border-border/60 py-5 md:mt-32">
            <h2 className="sr-only">Technologies I work with</h2>
            <div className="marquee-track items-center gap-10">
                {track.map((item, index) => (
                    <span
                        key={`${item}-${index}`}
                        aria-hidden={index >= stack.length}
                        className="flex shrink-0 items-center gap-10 font-mono text-sm text-muted-foreground"
                    >
                        {item}
                        <span className="h-1 w-1 rounded-full bg-primary/50" />
                    </span>
                ))}
            </div>
        </section>
    );
}

const AIRBNB_LISTING_URL = '';

function Stay() {
    return (
        <section className="full-bleed relative mt-28 overflow-hidden md:mt-36" aria-labelledby="stay-heading">
            <div aria-hidden="true" className="absolute inset-0 bg-card" />
            <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: 'radial-gradient(70% 70% at 72% 50%, var(--accent) 0%, transparent 70%)' }}
            />
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-card via-card/60 to-transparent" />

            <Container className="relative py-24 md:py-32">
                <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-6">
                        <p className="label-mono mb-4 flex items-center gap-3">
                            <span className="text-primary" data-numeric>
                                02
                            </span>
                            <span aria-hidden="true" className="h-px w-6 bg-primary/50" />
                            the guest room
                        </p>
                        <h2 id="stay-heading" className="display-2 text-foreground">
                            I host on Airbnb
                        </h2>
                        <p className="prose-measure mt-5 text-lg leading-relaxed text-muted-foreground">
                            Somewhere between the software and the soldering iron, I run a place for guests. It is wired
                            the way I'd wire my own home — fast wifi in every corner, lighting that behaves, and the
                            automation kept quietly out of the way.
                        </p>

                        <a
                            href={AIRBNB_LISTING_URL || 'mailto:karthick@gigcodes.com?subject=Airbnb%20enquiry'}
                            {...(AIRBNB_LISTING_URL ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-sm text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {AIRBNB_LISTING_URL ? 'View the listing' : 'Enquire about staying'}
                            <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                                &rarr;
                            </span>
                        </a>
                    </div>

                    <div className="lg:col-span-6">
                        <HouseScene className="mx-auto h-auto w-full max-w-[26rem]" />

                        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7">
                            {[
                                { label: 'wifi', value: 'Mesh, full coverage' },
                                { label: 'automation', value: 'Local-first, no cloud' },
                                { label: 'workspace', value: 'Desk and fast upload' },
                                { label: 'location', value: 'Madurai, India' },
                            ].map((fact) => (
                                <div key={fact.label} className="border-t border-border pt-4">
                                    <dt className="label-mono">{fact.label}</dt>
                                    <dd className="mt-2 text-sm font-medium text-foreground">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </Container>
        </section>
    );
}

function PhotoCard({ photo, className, ...rest }: { photo: FeaturedPhoto; className?: string } & React.ComponentPropsWithoutRef<typeof Link>) {
    return (
        <Link
            href={photo.slug ? `/photography/${photo.slug}` : '/photography'}
            className={`group relative block overflow-hidden rounded-2xl bg-muted ring-1 ring-border/50 ${className ?? ''}`}
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

function PhotoMarquee({ photos }: { photos: FeaturedPhoto[] }) {
    if (photos.length === 0) return null;

    // A marquee needs enough cards to fill the viewport twice over; below that
    // the loop reads as a stutter, so fall back to a static grid.
    const canScroll = photos.length >= 4;
    const track = canScroll ? [...photos, ...photos] : [];

    return (
        <section className="mt-28 md:mt-36" aria-labelledby="photography-heading">
            <Container>
                <SectionHeading
                    index="03"
                    eyebrow="through the lens"
                    title="Photography"
                    action={{ href: '/photography', label: 'View all' }}
                />
            </Container>

            {canScroll ? (
                <div className="marquee full-bleed mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
                    <div className="marquee-track gap-5">
                        {track.map((photo, index) => (
                            <PhotoCard
                                key={`${photo.slug}-${index}`}
                                photo={photo}
                                aria-hidden={index >= photos.length}
                                tabIndex={index >= photos.length ? -1 : undefined}
                                className="h-64 w-[22rem] shrink-0 sm:h-80 sm:w-[28rem]"
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <Container className="mt-10">
                    <Reveal
                        className={
                            photos.length === 1
                                ? 'grid grid-cols-1'
                                : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
                        }
                    >
                        {photos.map((photo, index) => (
                            <Reveal.Item key={photo.slug ?? index}>
                                <PhotoCard
                                    photo={photo}
                                    className={photos.length === 1 ? 'h-[26rem] w-full' : 'h-80 w-full'}
                                />
                            </Reveal.Item>
                        ))}
                    </Reveal>
                </Container>
            )}
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
            <time
                dateTime={article.date}
                className="font-mono text-xs tracking-[0.06em] text-muted-foreground sm:pt-1.5"
            >
                {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
            </time>

            <div>
                <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors duration-200 group-hover:text-primary">
                    {article.title}
                </h3>
                <p className="prose-measure mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {article.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-primary">
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
                    index="04"
                    eyebrow="latest writing"
                    title="Notes and essays"
                    action={articles.length > 0 ? { href: '/articles', label: 'All articles' } : undefined}
                />

                {articles.length > 0 ? (
                    <Reveal className="divide-y divide-border/60 border-b border-border/60">
                        {articles.map((article) => (
                            <Reveal.Item key={article.slug} as="article">
                                <ArticleRow article={article} />
                            </Reveal.Item>
                        ))}
                    </Reveal>
                ) : (
                    <div className="mt-10 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
                        <p className="font-display text-lg font-semibold text-foreground">Nothing published yet</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            The first piece is in progress. Subscribe below and it'll land in your inbox.
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
                <SectionHeading index="05" eyebrow="experience" title="Where I've worked" />

                <Reveal className="divide-y divide-border/60 border-b border-border/60">
                    {roles.map((role) => (
                        <Reveal.Item key={`${role.company}-${role.start}`}>
                            <div className="flex items-center gap-4 py-6">
                                {role.logo ? (
                                    <img
                                        src={role.logo}
                                        alt=""
                                        className="h-11 w-11 shrink-0 rounded-lg bg-card object-contain p-1.5 ring-1 ring-border/60"
                                    />
                                ) : (
                                    <div
                                        aria-hidden="true"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-card font-mono text-sm text-muted-foreground ring-1 ring-border/60"
                                    >
                                        {role.company.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0 flex-auto">
                                    <p className="font-display text-base font-semibold tracking-[-0.01em] text-foreground">
                                        {role.company}
                                    </p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">{role.title}</p>
                                </div>
                                <p className="shrink-0 font-mono text-xs text-muted-foreground" data-numeric>
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

function NewsletterBand() {
    const { onPointerMove } = useSpotlight();

    return (
        <section className="mt-28 md:mt-36" aria-labelledby="newsletter-heading">
            <Container>
                <div onPointerMove={onPointerMove} className="spotlight overflow-hidden rounded-3xl surface-elevated">
                    <div className="terminal-window-header">
                        <span className="terminal-window-dot red" />
                        <span className="terminal-window-dot yellow" />
                        <span className="terminal-window-dot green" />
                        <span className="ml-2 font-mono text-xs text-muted-foreground">subscribe.sh</span>
                    </div>

                    <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 md:items-center md:p-12">
                        <div>
                            <p className="mb-4 font-mono text-sm text-muted-foreground">
                                <span className="text-primary">$</span> ./subscribe <span className="caret" />
                            </p>
                            <h2 id="newsletter-heading" className="display-3 text-foreground">
                                Get new writing in your inbox
                            </h2>
                            <p className="prose-measure mt-4 text-base leading-relaxed text-muted-foreground">
                                Occasional notes on building software, travel, and the things in between. No spam,
                                unsubscribe anytime.
                            </p>
                        </div>

                        <form action="/thank-you" method="POST" className="md:justify-self-end md:pl-8">
                            <label htmlFor="newsletter-email" className="label-mono mb-3 block">
                                email address
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    id="newsletter-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    required
                                    className="min-w-0 flex-auto rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                                />
                                <Button type="submit" className="shrink-0 font-mono">
                                    Subscribe
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Container>
        </section>
    );
}

export default function Home({ articles = [], featuredPhotos = [], roles = [], seo, jsonLd }: HomeProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <Hero />
            <StackMarquee />
            <Capabilities />
            <Stay />
            <PhotoMarquee photos={featuredPhotos} />
            <Writing articles={articles} />
            <Work roles={roles} />
            <NewsletterBand />
        </PublicLayout>
    );
}
