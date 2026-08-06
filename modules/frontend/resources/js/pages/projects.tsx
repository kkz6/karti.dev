import { Card } from '@frontend/components/Card';
import { Container } from '@frontend/components/Container';
import { Reveal } from '@frontend/components/Reveal';
import { SeoHead, SeoData } from '@frontend/components/SeoHead';
import { SimpleLayout } from '@frontend/components/SimpleLayout';
import { useSpotlight } from '@frontend/components/useSpotlight';
import PublicLayout from '@frontend/layouts/public-layout';
import React from 'react';

interface Project {
    name: string;
    description: string;
    link: {
        href: string;
        label: string;
    };
    logo: string;
}

interface ProjectsProps {
    projects: Project[];
    seo?: SeoData;
}

function LinkIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path
                d="M15.712 11.823a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm-4.95 1.768a.75.75 0 0 0 1.06-1.06l-1.06 1.06Zm-2.475-1.414a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm4.95-1.768a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm3.359.53-.884.884 1.06 1.06.885-.883-1.061-1.06Zm-4.95-2.12 1.414-1.415L12 6.344l-1.415 1.413 1.061 1.061Zm0 3.535a2.5 2.5 0 0 1 0-3.536l-1.06-1.06a4 4 0 0 0 0 5.656l1.06-1.06Zm4.95-4.95a2.5 2.5 0 0 1 0 3.535L17.656 12a4 4 0 0 0 0-5.657l-1.06 1.06Zm1.06-1.06a4 4 0 0 0-5.656 0l1.06 1.06a2.5 2.5 0 0 1 3.536 0l1.06-1.06Zm-7.07 7.07.176.177 1.06-1.06-.176-.177-1.06 1.06Zm-3.183-.353.884-.884-1.06-1.06-.884.883 1.06 1.06Zm4.95 2.121-1.414 1.414 1.06 1.06 1.415-1.413-1.06-1.061Zm0-3.536a2.5 2.5 0 0 1 0 3.536l1.06 1.06a4 4 0 0 0 0-5.656l-1.06 1.06Zm-4.95 4.95a2.5 2.5 0 0 1 0-3.535L6.344 12a4 4 0 0 0 0 5.656l1.06-1.06Zm-1.06 1.06a4 4 0 0 0 5.657 0l-1.061-1.06a2.5 2.5 0 0 1-3.535 0l-1.061 1.06Zm7.07-7.07-.176-.177-1.06 1.06.176.178 1.06-1.061Z"
                fill="currentColor"
            />
        </svg>
    );
}

function ProjectCard({ project }: { project: Project }) {
    const { onPointerMove } = useSpotlight<HTMLElement>();

    return (
        <Card
            as="article"
            href={project.link.href}
            onPointerMove={onPointerMove}
            className="spotlight h-full rounded-3xl surface-elevated p-6 transition-transform duration-300 ease-out hover:-translate-y-1"
        >
            <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-background ring-1 ring-border/70">
                {project.logo ? (
                    <img src={project.logo} alt="" className="h-7 w-7 object-contain" />
                ) : (
                    <span aria-hidden="true" className="font-mono text-sm text-muted-foreground">
                        {project.name.charAt(0)}
                    </span>
                )}
            </div>

            <h2 className="relative z-10 mt-6 font-display text-lg font-semibold tracking-[-0.015em] text-foreground transition-colors duration-200 group-hover:text-primary">
                {project.name}
            </h2>

            <p className="relative z-10 mt-2.5 flex-auto text-[0.9375rem] leading-relaxed text-muted-foreground">
                {project.description}
            </p>

            {/* Pinned to the bottom so CTAs line up across cards of differing height */}
            <p className="relative z-10 mt-6 flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors duration-200 group-hover:text-primary">
                <LinkIcon className="h-4 w-4 flex-none" />
                <span>{project.link.label}</span>
            </p>
        </Card>
    );
}

export default function Projects({ projects = [], seo }: ProjectsProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} />
            <SimpleLayout
                eyebrow="projects"
                title="Things I've built, broken, and shipped anyway."
                intro="A mix of client work, open source, and side projects that started as a weekend idea. Several are open-source — if something looks useful, the code is a click away."
            >
                {projects.length > 0 ? (
                    <Reveal
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                        stagger={0.06}
                    >
                        {projects.map((project) => (
                            <Reveal.Item key={project.name} className="h-full">
                                <ProjectCard project={project} />
                            </Reveal.Item>
                        ))}
                    </Reveal>
                ) : (
                    <Container className="px-0">
                        <div className="rounded-3xl border border-dashed border-border px-6 py-20 text-center">
                            <p className="font-mono text-sm text-primary">./projects --list</p>
                            <p className="mt-4 font-display text-xl font-semibold text-foreground">
                                No projects published yet
                            </p>
                            <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
                                Work in progress. In the meantime, most of what I build ends up on GitHub first.
                            </p>
                            <a
                                href="https://github.com/kkz6"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group mt-8 inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 font-mono text-sm text-foreground transition-colors duration-200 hover:border-primary/40 hover:text-primary"
                            >
                                Browse GitHub
                                <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                                    &rarr;
                                </span>
                            </a>
                        </div>
                    </Container>
                )}
            </SimpleLayout>
        </PublicLayout>
    );
}
