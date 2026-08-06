import { Card } from '@frontend/components/Card';
import { Reveal } from '@frontend/components/Reveal';
import { Section } from '@frontend/components/Section';
import { SimpleLayout } from '@frontend/components/SimpleLayout';
import { SeoHead, SeoData } from '@frontend/components/SeoHead';
import PublicLayout from '@frontend/layouts/public-layout';
import React from 'react';

interface SpeakingEvent {
    title: string;
    description: string;
    event: string;
    cta: string;
    href: string;
    date?: string;
    type: string;
}

interface SpeakingProps {
    events?: Record<string, SpeakingEvent[]>;
    seo?: SeoData;
}

function SpeakingSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Section title={title}>
            <Reveal className="space-y-12">{children}</Reveal>
        </Section>
    );
}

function Appearance({ title, description, event, cta, href }: SpeakingEvent) {
    return (
        <Reveal.Item as="article">
            <Card as="div" href={href}>
                <Card.Title as="h3" href={href}>
                    {title}
                </Card.Title>
                <Card.Eyebrow decorate>{event}</Card.Eyebrow>
                <Card.Description>{description}</Card.Description>
                <Card.Cta>{cta}</Card.Cta>
            </Card>
        </Reveal.Item>
    );
}

export default function Speaking({ events = {}, seo }: SpeakingProps) {
    // Helper function to format event type titles
    const formatEventTypeTitle = (type: string) => {
        switch (type) {
            case 'conference':
                return 'Conferences';
            case 'podcast':
                return 'Podcasts';
            case 'workshop':
                return 'Workshops';
            case 'webinar':
                return 'Webinars';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1) + 's';
        }
    };

    return (
        <>
            <SeoHead seo={seo} />
            <PublicLayout>
                <SimpleLayout
                    eyebrow="speaking"
                    title="Talks, podcasts, and the occasional workshop."
                    intro="One of my favourite ways to share ideas is live on stage — there's far more bandwidth there than in writing. I like podcast interviews for the same reason: I get to answer real questions instead of just presenting opinions."
                >
                    <div className="space-y-24">
                        {Object.keys(events).length > 0 ? (
                            Object.entries(events).map(([eventType, typeEvents]) => (
                                <SpeakingSection key={eventType} title={formatEventTypeTitle(eventType)}>
                                    {typeEvents.map((event, index) => (
                                        <Appearance
                                            key={`${eventType}-${index}`}
                                            title={event.title}
                                            description={event.description}
                                            event={event.event}
                                            cta={event.cta}
                                            href={event.href}
                                        />
                                    ))}
                                </SpeakingSection>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border px-6 py-20 text-center">
                                <p className="font-mono text-sm text-primary">./speaking --upcoming</p>
                                <p className="mt-4 font-display text-xl font-semibold text-foreground">
                                    Nothing on the calendar right now
                                </p>
                                <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
                                    Past talks are being written up. If you're organising an event and want me on the
                                    lineup, get in touch.
                                </p>
                                <a
                                    href="mailto:karthick@gigcodes.com"
                                    className="group mt-8 inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 font-mono text-sm text-foreground transition-colors duration-200 hover:border-primary/40 hover:text-primary"
                                >
                                    Invite me to speak
                                    <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                                        &rarr;
                                    </span>
                                </a>
                            </div>
                        )}
                    </div>
                </SimpleLayout>
            </PublicLayout>
        </>
    );
}
