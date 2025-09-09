import { Link } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card } from '../components/Card';
import PublicLayout from '../layouts/public-layout';
import { Container } from '../components/Container';
import clsx from 'clsx';
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface ArticleData {
    slug: string;
    title: string;
    description: string;
    date: string;
}

interface HomeProps {
    articles: ArticleData[];
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
    ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Link className="group -m-1 p-1" href={href} {...props}>
            <Icon className="h-6 w-6 fill-zinc-500 transition group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300" />
        </Link>
    );
}

function Article({ article }: { article: ArticleData }) {
    return (
        <Card as="article">
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
        <form action="/thank-you" method="POST" className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
            <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <MailIcon className="h-6 w-6 flex-none" />
                <span className="ml-3">Stay up to date</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Get notified when I publish something new, and unsubscribe at any time.</p>
            <div className="mt-6 flex items-center">
                <input
                    type="email"
                    placeholder="Email address"
                    aria-label="Email address"
                    required
                    className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none sm:text-sm dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
                />
                <Button type="submit" className="ml-4 flex-none">
                    Join
                </Button>
            </div>
        </form>
    );
}


function InteractivePhoto({ image, rotation, index }: { image: any; rotation: string; index: number }) {
    const [isHovered, setIsHovered] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useTransform(mouseY, [-100, 100], [8, -8]);
    const rotateY = useTransform(mouseX, [-100, 100], [-8, 8]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isHovered) return;
        
        // Prevent tracking during scroll events
        if (event.buttons !== 0) return; // Mouse button is pressed (scrolling)
        
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        mouseX.set(event.clientX - centerX);
        mouseY.set(event.clientY - centerY);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // Smoothly reset to center with spring animation
        mouseX.set(0, true);
        mouseY.set(0, true);
    };

    // Handle scroll events to reset animations
    React.useEffect(() => {
        const handleScroll = () => {
            if (isHovered) {
                setIsHovered(false);
                mouseX.set(0, true);
                mouseY.set(0, true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHovered, mouseX, mouseY]);

    return (
        <motion.div
            className="flex flex-col items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <motion.div
                className={clsx(
                    'rounded-2xl bg-gradient-to-br from-zinc-50 via-white to-zinc-100 shadow-lg dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 overflow-hidden',
                    rotation,
                )}
                style={{
                    rotateX: isHovered ? rotateX : 0,
                    rotateY: isHovered ? rotateY : 0,
                }}
                whileHover={{ rotate: 0 }}
                transition={{ 
                    duration: 0.4, 
                    ease: "easeOut",
                    rotateX: { duration: 0.3, ease: "easeOut" },
                    rotateY: { duration: 0.3, ease: "easeOut" }
                }}
            >
                {/* Image container with padding */}
                <div className="p-4 flex justify-center">
                    <div className="relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl sm:w-72 sm:rounded-2xl cursor-pointer">
                        <img src={image.src} alt="" sizes="(min-width: 640px) 18rem, 11rem" className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                </div>
                
                {/* Title and Description inside the card */}
                <div className="px-4 pb-4 text-center">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 sm:text-base">{image.title}</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm mt-1">{image.description}</p>
                </div>
            </motion.div>
        </motion.div>
    );
}

function Photos() {
    const images = [
        {
            src: '/images/photos/image-1.jpg',
            title: 'Pilot\'s View',
            description: 'Cockpit controls over water'
        },
        {
            src: '/images/photos/image-2.jpg',
            title: 'Conference Hall',
            description: 'Speaking at tech event'
        },
        {
            src: '/images/photos/image-3.jpg',
            title: 'Work Station',
            description: 'Productive workspace setup'
        },
        {
            src: '/images/photos/image-4.jpg',
            title: 'Mountain Peak',
            description: 'Adventure in the clouds'
        },
        {
            src: '/images/photos/image-5.jpg',
            title: 'Space Explorer',
            description: 'Mars-like landscape'
        }
    ];
    const rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2'];

    return (
        <div className="mt-16 sm:mt-20">
            <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
                {images.map((image, imageIndex) => (
                    <InteractivePhoto 
                        key={image.src}
                        image={image}
                        rotation={rotations[imageIndex % rotations.length]}
                        index={imageIndex}
                    />
                ))}
            </div>
        </div>
    );
}

export default function Home({ articles = [] }: HomeProps) {
    return (
        <PublicLayout>
            <Container className="mt-9">
                <div className="max-w-2xl">
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
                        Software designer, founder, and amateur astronaut.
                    </h1>
                    <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
                        I'm Spencer, a software designer and entrepreneur based in New York City. I'm the founder and CEO of Planetaria, where we
                        develop technologies that empower regular people to explore space on their own terms.
                    </p>
                    <div className="mt-6 flex gap-6">
                        <SocialLink href="https://x.com/ikkarti" aria-label="Follow on X" icon={XIcon} />
                        <SocialLink href="https://github.com/kkz6" aria-label="Follow on GitHub" icon={GitHubIcon} />
                        <SocialLink href="https://linkedin.com/in/ikkarti" aria-label="Follow on LinkedIn" icon={LinkedInIcon} />
                    </div>
                </div>
            </Container>
            <Photos />
            <Container className="mt-24 md:mt-28">
                <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
                    <div className="flex flex-col gap-16">
                        {articles.map((article) => (
                            <Article key={article.slug} article={article} />
                        ))}
                    </div>
                    <div className="space-y-10 lg:pl-16 xl:pl-24">
                        <Newsletter />
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
