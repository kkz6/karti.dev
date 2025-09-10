import { Card } from '@frontend/components/Card';
import { Section } from '@frontend/components/Section';
import { SimpleLayout } from '@frontend/components/SimpleLayout';
import PublicLayout from '@frontend/layouts/public-layout';
import { Head } from '@inertiajs/react';
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
}

function SpeakingSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Section title={title}>
            <div className="space-y-16">{children}</div>
        </Section>
    );
}

function Appearance({ title, description, event, cta, href }: SpeakingEvent) {
    return (
        <Card as="article">
            <Card.Title as="h3" href={href}>
                {title}
            </Card.Title>
            <Card.Eyebrow decorate>{event}</Card.Eyebrow>
            <Card.Description>{description}</Card.Description>
            <Card.Cta>{cta}</Card.Cta>
        </Card>
    );
}

export default function Speaking({ events = {} }: SpeakingProps) {
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
            <Head title="Speaking" />
            <PublicLayout>
                <SimpleLayout
                    title="I've spoken at events all around the world and been interviewed for many podcasts."
                    intro="One of my favorite ways to share my ideas is live on stage, where there's so much more communication bandwidth than there is in writing, and I love podcast interviews because they give me the opportunity to answer questions instead of just present my opinions."
                >
                    <div className="space-y-20">
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
                            <div className="text-center py-12">
                                <p className="text-lg text-gray-500">No speaking events available at the moment.</p>
                            </div>
                        )}
                    </div>
                </SimpleLayout>
            </PublicLayout>
        </>
    );
}
