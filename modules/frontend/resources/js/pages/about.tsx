import { Container } from '@frontend/components/Container';
import { Reveal } from '@frontend/components/Reveal';
import { SeoData, SeoHead } from '@frontend/components/SeoHead';
import PublicLayout from '@frontend/layouts/public-layout';
import React from 'react';

function SocialLink({
    className,
    href,
    children,
    icon: Icon,
}: {
    className?: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <li className={className ? className + ' flex' : 'flex'}>
            <a
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="group flex items-center font-mono text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
                <Icon className="h-5 w-5 flex-none fill-current" />
                <span className="ml-3 border-b border-transparent transition-colors duration-200 group-hover:border-primary/40">
                    {children}
                </span>
            </a>
        </li>
    );
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path
                fillRule="evenodd"
                d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
            />
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

interface AboutProps {
    portraitImage?: string;
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

const facts = [
    { label: 'based in', value: 'Bangalore, India' },
    { label: 'builds', value: 'Software & hardware' },
    { label: 'consults on', value: 'Visas, homes, networks' },
    { label: 'hosts', value: 'An Airbnb in Madurai' },
];

export default function About({ portraitImage = '/images/about.jpg', seo, jsonLd }: AboutProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />

            <Container className="mt-16 sm:mt-24">
                <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-16">
                    {/* Portrait sticks alongside the copy on wide screens */}
                    <div className="lg:order-last lg:col-span-5">
                        <div className="lg:sticky lg:top-28">
                            <div className="relative max-w-xs lg:max-w-none">
                                <div
                                    aria-hidden="true"
                                    className="absolute -inset-3 -z-10 rounded-3xl border border-border/70"
                                />
                                <img
                                    src={portraitImage}
                                    alt="Karthick speaking at a meetup"
                                    sizes="(min-width: 1024px) 28rem, 20rem"
                                    className="aspect-4/5 w-full rounded-2xl bg-muted object-cover shadow-xl"
                                />
                            </div>

                            <dl className="mt-10 space-y-5 border-t border-border/70 pt-8">
                                {facts.map((fact) => (
                                    <div key={fact.label} className="flex items-baseline justify-between gap-4">
                                        <dt className="label-mono">{fact.label}</dt>
                                        <dd className="text-right text-sm font-medium text-foreground">{fact.value}</dd>
                                    </div>
                                ))}
                            </dl>

                            <ul role="list" className="mt-8 space-y-4 border-t border-border/70 pt-8">
                                <SocialLink href="https://x.com/ikkarti" icon={XIcon}>
                                    Follow on X
                                </SocialLink>
                                <SocialLink href="https://github.com/kkz6" icon={GitHubIcon}>
                                    Follow on GitHub
                                </SocialLink>
                                <SocialLink href="https://linkedin.com/in/ikkarti" icon={LinkedInIcon}>
                                    Follow on LinkedIn
                                </SocialLink>
                                <SocialLink href="mailto:karthick@gigcodes.com" icon={MailIcon} className="pt-2">
                                    karthick@gigcodes.com
                                </SocialLink>
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <p className="label-mono mb-5 flex items-center gap-2">
                            <span aria-hidden="true" className="h-px w-6 bg-primary/50" />
                            about
                        </p>

                        <h1 className="display-2 text-foreground">
                            I've been building software for as long as I can remember.
                        </h1>

                        <Reveal className="prose-measure mt-10 space-y-7 text-lg leading-relaxed text-muted-foreground">
                            <Reveal.Item>
                                <p>
                                    There's something magical about turning ideas into working code that can solve real
                                    problems and make people's lives better. What makes my journey unique is that I've
                                    combined this passion with my love for travel.
                                </p>
                            </Reveal.Item>
                            <Reveal.Item>
                                <p>
                                    My car has become my mobile office. I can work from anywhere — parked by a scenic
                                    mountain view, near the ocean, or in a bustling city. That freedom has let me
                                    experience different places while continuing to build and create.
                                </p>
                            </Reveal.Item>
                            <Reveal.Item>
                                <p>
                                    I'm planning more overseas travel, with a mission to understand people better and
                                    develop software that truly serves their needs. The best solutions come from
                                    understanding diverse perspectives and the real-world challenges people face across
                                    different cultures and environments.
                                </p>
                            </Reveal.Item>
                            <Reveal.Item>
                                <p>
                                    I also work on personal projects with a focus on keeping costs as low as possible, so
                                    I can put useful tools in the hands of other developers, travellers, and anyone who
                                    dares to dream big. I love connecting software with hardware through
                                    microcontrollers — bridging the digital and physical brings new possibilities into
                                    the world.
                                </p>
                            </Reveal.Item>
                            <Reveal.Item>
                                <p>
                                    And yes, I absolutely love rockets. The engineering precision, the ambitious goals,
                                    and the sheer audacity of reaching for the stars resonate deeply with how I approach
                                    both development and life.
                                </p>
                            </Reveal.Item>
                        </Reveal>

                        <blockquote className="mt-14 border-l-2 border-primary/50 pl-6">
                            <p className="font-display text-xl font-medium leading-relaxed tracking-[-0.015em] text-foreground">
                                The best solutions come from understanding the real problems people face — not the ones
                                we imagine from a desk.
                            </p>
                        </blockquote>
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
