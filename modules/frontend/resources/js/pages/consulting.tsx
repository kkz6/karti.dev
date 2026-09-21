import { Container } from '@frontend/components/Container';
import { Reveal } from '@frontend/components/Reveal';
import { SeoData, SeoHead } from '@frontend/components/SeoHead';
import { SimpleLayout } from '@frontend/components/SimpleLayout';
import { useSpotlight } from '@frontend/components/useSpotlight';
import PublicLayout from '@frontend/layouts/public-layout';
import { Link } from '@inertiajs/react';

interface ConsultingProps {
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

const services = [
    {
        id: 'visa',
        name: 'Visa consultations',
        summary:
            'Visa applications fail on paperwork far more often than on eligibility. I help you work out which route applies to you and get the documents right the first time.',
        includes: [
            'Choosing the right visa category',
            'Document checklists and evidence',
            'Timelines, appointments and sequencing',
            'Common refusal reasons and how to avoid them',
        ],
        format: '60 min call + document checklist',
        contactTopic: 'visa',
    },
    {
        id: 'home-automation',
        name: 'Home automation',
        summary:
            'Smart homes go wrong when the pieces do not talk to each other. I help you pick a stack that works locally, keeps running when the internet does not, and stays easy to live with.',
        includes: [
            'Choosing a platform and protocols',
            'Lighting, climate and sensor layout',
            'Local-first automation and fallbacks',
            'Migrating away from cloud lock-in',
        ],
        format: '60 min call + system plan',
        contactTopic: 'consulting',
    },
    {
        id: 'networking',
        name: 'Networking',
        summary:
            'Most home and small-office wifi problems are layout problems, not hardware problems. I help you design a network that covers the space, stays fast, and is properly segmented.',
        includes: [
            'Access point placement and coverage',
            'Router, switch and cabling choices',
            'VLANs and guest or IoT isolation',
            'Remote access and monitoring',
        ],
        format: '60 min call + network diagram',
        contactTopic: 'consulting',
    },
];

function ServiceCard({ service }: { service: (typeof services)[number] }) {
    const { onPointerMove } = useSpotlight();

    return (
        <div id={service.id} onPointerMove={onPointerMove} className="spotlight surface-elevated flex h-full flex-col rounded-3xl p-7">
            <h3 className="font-display text-foreground text-xl font-semibold tracking-[-0.02em]">{service.name}</h3>

            <p className="text-muted-foreground mt-3 text-[0.9375rem] leading-relaxed">{service.summary}</p>

            <ul role="list" className="mt-6 flex-auto space-y-2.5">
                {service.includes.map((item) => (
                    <li key={item} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
                        <span aria-hidden="true" className="bg-primary mt-2 h-1 w-1 shrink-0 rounded-full" />
                        {item}
                    </li>
                ))}
            </ul>

            <div className="border-border/60 mt-7 border-t pt-5">
                <p className="text-muted-foreground font-mono text-xs tracking-[0.06em]">{service.format}</p>
                <Link
                    href={`${route('contact')}?topic=${service.contactTopic}`}
                    aria-label={`Contact me about ${service.name}`}
                    className="group border-primary/35 bg-primary/10 text-foreground focus-visible:ring-primary/50 focus-visible:ring-offset-background hover:border-primary/55 hover:bg-primary/15 mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs font-medium transition-[background-color,border-color,transform] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0"
                >
                    Ask about this
                    <span aria-hidden="true" className="text-primary transition-transform duration-200 group-hover:translate-x-0.5">
                        &rarr;
                    </span>
                </Link>
            </div>
        </div>
    );
}

export default function Consulting({ seo, jsonLd }: ConsultingProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />

            <SimpleLayout
                eyebrow="consulting"
                title="Visas that clear, and homes that run themselves."
                intro="Three things I get asked about often enough that I now set aside time for them. Sessions are one-on-one, over a call, and you leave with something written down, not just a nice chat."
            >
                <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-3" stagger={0.08}>
                    {services.map((service) => (
                        <Reveal.Item key={service.id} className="h-full">
                            <ServiceCard service={service} />
                        </Reveal.Item>
                    ))}
                </Reveal>
            </SimpleLayout>

            {/* How it works */}
            <Container className="mt-28 md:mt-36">
                <div className="border-border/60 border-b pb-6">
                    <p className="label-mono mb-4 flex items-center gap-3">
                        <span className="text-primary/70" data-numeric>
                            01
                        </span>
                        <span aria-hidden="true" className="bg-primary/40 h-px w-6" />
                        how it works
                    </p>
                    <h2 className="display-3 text-foreground">Three steps, no discovery-call theatre</h2>
                </div>

                <Reveal className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3">
                    {[
                        {
                            step: '01',
                            title: 'Tell me the problem',
                            body: 'Use the contact form to explain what you are trying to do and roughly when. A few lines is plenty.',
                        },
                        {
                            step: '02',
                            title: 'We book a call',
                            body: 'Sixty minutes, screen shared, working through your actual situation rather than slides.',
                        },
                        {
                            step: '03',
                            title: 'You get it in writing',
                            body: 'A written plan afterwards, whether that is the route, the parts list, or the network diagram, so nothing lives only in memory.',
                        },
                    ].map((item) => (
                        <Reveal.Item key={item.step}>
                            <p className="text-primary font-mono text-sm" data-numeric>
                                {item.step}
                            </p>
                            <h3 className="font-display text-foreground mt-3 text-lg font-semibold tracking-[-0.015em]">{item.title}</h3>
                            <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-relaxed">{item.body}</p>
                        </Reveal.Item>
                    ))}
                </Reveal>
            </Container>

            {/* Contact */}
            <Container className="mt-28 md:mt-36">
                <div className="surface-elevated overflow-hidden rounded-3xl">
                    <div className="terminal-window-header">
                        <span className="terminal-window-dot red" />
                        <span className="terminal-window-dot yellow" />
                        <span className="terminal-window-dot green" />
                        <span className="text-muted-foreground ml-2 font-mono text-xs">contact.sh</span>
                    </div>

                    <div className="p-8 md:p-12">
                        <p className="text-muted-foreground mb-4 font-mono text-sm">
                            <span className="text-primary">$</span> mail karthick <span className="caret" />
                        </p>
                        <h2 className="display-3 text-foreground max-w-2xl">Tell me what you're planning</h2>
                        <p className="prose-measure text-muted-foreground mt-4 text-base leading-relaxed">
                            Use the contact form to share which service you need and your rough timeline. I'll reply with availability and the next
                            useful step.
                        </p>
                        <Link
                            href={`${route('contact')}?topic=consulting`}
                            className="group bg-primary text-primary-foreground focus-visible:ring-primary/50 focus-visible:ring-offset-background mt-8 inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 font-mono text-sm font-medium transition-[transform,box-shadow] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0"
                        >
                            Contact me
                            <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                                &rarr;
                            </span>
                        </Link>
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
