import { Card } from '@frontend/components/Card';
import { Reveal } from '@frontend/components/Reveal';
import { Section } from '@frontend/components/Section';
import { SeoData, SeoHead } from '@frontend/components/SeoHead';
import { SimpleLayout } from '@frontend/components/SimpleLayout';
import PublicLayout from '@frontend/layouts/public-layout';
import { format, parseISO } from 'date-fns';
import React from 'react';

interface SpeakingEvent {
    title: string;
    description: string;
    event: string;
    cta: string;
    href: string;
    date?: string | null;
    location?: string | null;
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

function Appearance({ title, description, event, cta, href, date, location }: SpeakingEvent) {
    return (
        <Reveal.Item as="article">
            <Card as="div" href={href}>
                <Card.Title as="h3" href={href}>
                    {title}
                </Card.Title>
                <Card.Eyebrow decorate>{event}</Card.Eyebrow>
                {(date || location) && (
                    <p className="text-muted-foreground relative z-10 mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs">
                        {date && <time dateTime={date}>{format(parseISO(date), 'd MMM yyyy')}</time>}
                        {date && location && <span aria-hidden="true">·</span>}
                        {location && <span>{location}</span>}
                    </p>
                )}
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
                return 'Talks & meetups';
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
                                        <Appearance key={`${eventType}-${index}`} {...event} />
                                    ))}
                                </SpeakingSection>
                            ))
                        ) : (
                            <div className="border-border rounded-2xl border border-dashed px-6 py-20 text-center">
                                <p className="text-primary font-mono text-sm">./speaking --upcoming</p>
                                <p className="font-display text-foreground mt-4 text-xl font-semibold">Nothing on the calendar right now</p>
                                <p className="text-muted-foreground mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed">
                                    Past talks are being written up. If you're organising an event and want me on the lineup, get in touch.
                                </p>
                                <a
                                    href="mailto:hi@karti.dev"
                                    className="group border-border text-foreground hover:border-primary/40 hover:text-primary mt-8 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 font-mono text-sm transition-colors duration-200"
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
