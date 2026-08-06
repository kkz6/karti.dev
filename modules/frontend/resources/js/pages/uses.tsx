import { Card } from '@frontend/components/Card';
import { Reveal } from '@frontend/components/Reveal';
import { Section } from '@frontend/components/Section';
import { SimpleLayout } from '@frontend/components/SimpleLayout';
import { SeoHead, SeoData } from '@frontend/components/SeoHead';
import PublicLayout from '@frontend/layouts/public-layout';
import React from 'react';

interface Tool {
    title: string;
    description: string;
    href?: string;
}

interface UsesProps {
    sections?: any[];
    seo?: SeoData;
}

function ToolsSection({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <Section title={title}>
            <Reveal className="space-y-10">{children}</Reveal>
        </Section>
    );
}

function Tool({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
    return (
        <Reveal.Item>
            <Card as="div" href={href}>
                <Card.Title as="h3" href={href}>
                    {title}
                </Card.Title>
                <Card.Description>{children}</Card.Description>
            </Card>
        </Reveal.Item>
    );
}

export default function Uses({ sections = [], seo }: UsesProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <PublicLayout>
                <SimpleLayout
                    eyebrow="uses"
                    title="The tools I reach for every day."
                    intro="I get asked a lot about what I use to build software and stay productive — and what I buy to convince myself I'm being productive when I'm really just procrastinating. Here's the current list."
                >
                    <div className="space-y-24">
                        {sections.length > 0 ? (
                            sections.map((section) => (
                                <ToolsSection key={section.title} title={section.title}>
                                    {section.tools.map((tool: Tool) => (
                                        <Tool key={tool.title} title={tool.title} href={tool.href}>
                                            {tool.description}
                                        </Tool>
                                    ))}
                                </ToolsSection>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border px-6 py-20 text-center">
                                <p className="font-mono text-sm text-primary">cat ~/.setup</p>
                                <p className="mt-4 font-display text-xl font-semibold text-foreground">
                                    The list isn't written up yet
                                </p>
                                <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
                                    Editor config, keyboard, camera bag and the rest are on their way here.
                                </p>
                            </div>
                        )}
                    </div>
                </SimpleLayout>
            </PublicLayout>
        </>
    );
}
