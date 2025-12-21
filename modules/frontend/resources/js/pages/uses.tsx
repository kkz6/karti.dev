import { Card } from '@frontend/components/Card';
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
            <ul role="list" className="space-y-16">
                {children}
            </ul>
        </Section>
    );
}

function Tool({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
    return (
        <Card as="li">
            <Card.Title as="h3" href={href}>
                {title}
            </Card.Title>
            <Card.Description>{children}</Card.Description>
        </Card>
    );
}

export default function Uses({ sections = [], seo }: UsesProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <PublicLayout>
                <SimpleLayout
                    title="Software I use, gadgets I love, and other things I recommend."
                    intro="I get asked a lot about the things I use to build software, stay productive, or buy to fool myself into thinking I'm being productive when I'm really just procrastinating. Here's a big list of all of my favorite stuff."
                >
                    <div className="space-y-20">
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
                            <div className="text-center py-12">
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                    No tools or recommendations yet
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Check back soon for my favorite tools and recommendations.
                                </p>
                            </div>
                        )}
                    </div>
                </SimpleLayout>
            </PublicLayout>
        </>
    );
}
