import { Container } from '@frontend/components/Container';
import { type SeoData, SeoHead } from '@frontend/components/SeoHead';
import PublicLayout from '@frontend/layouts/public-layout';
import { Link } from '@inertiajs/react';

interface ConsultingProps {
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

const services = [
    {
        id: 'visa',
        name: 'Visa applications',
        summary: 'Categories, documents, and next steps.',
        outcome: 'Document checklist',
        topic: 'visa',
    },
    {
        id: 'home-automation',
        name: 'Home automation',
        summary: 'Local setups, useful automations, and devices that work together.',
        outcome: 'System plan',
        topic: 'consulting',
    },
    {
        id: 'networking',
        name: 'Networking',
        summary: 'Wi-Fi coverage, equipment, and keeping devices separate.',
        outcome: 'Network diagram',
        topic: 'consulting',
    },
];

export default function Consulting({ seo, jsonLd }: ConsultingProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <Container className="mt-16 sm:mt-24">
                <div className="max-w-3xl">
                    <header>
                        <h1 className="display-2 text-foreground">Consulting</h1>
                        <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-relaxed">
                            One-on-one help with visa applications, home automation, and networks.
                        </p>
                        <p className="text-muted-foreground mt-4 text-sm">60-minute call, followed by written notes.</p>
                    </header>

                    <div className="border-border/60 mt-10 border-t sm:mt-12">
                        {services.map((service) => (
                            <section
                                key={service.id}
                                id={service.id}
                                aria-labelledby={`${service.id}-heading`}
                                className="border-border/60 scroll-mt-28 border-b"
                            >
                                <Link
                                    href={`${route('contact')}?topic=${service.topic}`}
                                    aria-label={`Contact me about ${service.name}`}
                                    className="group focus-visible:outline-primary flex items-center justify-between gap-6 py-6 focus-visible:outline-2 focus-visible:outline-offset-4 sm:py-7"
                                >
                                    <div>
                                        <h2
                                            id={`${service.id}-heading`}
                                            className="font-display text-foreground group-hover:text-primary text-lg font-semibold tracking-tight transition-colors"
                                        >
                                            {service.name}
                                        </h2>
                                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{service.summary}</p>
                                        <p className="text-muted-foreground/80 mt-3 font-mono text-xs">{service.outcome}</p>
                                    </div>
                                    <span aria-hidden="true" className="text-primary shrink-0 transition-transform group-hover:translate-x-1">
                                        &rarr;
                                    </span>
                                </Link>
                            </section>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                            Send a few details about what you need and your timeline.
                        </p>
                        <Link
                            href={`${route('contact')}?topic=consulting`}
                            className="text-primary decoration-primary/30 hover:decoration-primary focus-visible:outline-primary inline-flex min-h-11 items-center gap-2 font-mono text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            Write to me <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
