import { Container } from '@frontend/components/Container';
import { Reveal } from '@frontend/components/Reveal';
import { SeoData, SeoHead } from '@frontend/components/SeoHead';
import { SimpleLayout } from '@frontend/components/SimpleLayout';
import { useSpotlight } from '@frontend/components/useSpotlight';
import PublicLayout from '@frontend/layouts/public-layout';

interface ConsultingProps {
    contactEmail?: string;
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
    },
];

function ServiceCard({ service }: { service: (typeof services)[number] }) {
    const { onPointerMove } = useSpotlight();

    return (
        <div
            id={service.id}
            onPointerMove={onPointerMove}
            className="spotlight flex h-full flex-col rounded-3xl surface-elevated p-7"
        >
            <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">{service.name}</h3>

            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{service.summary}</p>

            <ul role="list" className="mt-6 flex-auto space-y-2.5">
                {service.includes.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {item}
                    </li>
                ))}
            </ul>

            <p className="mt-7 border-t border-border/60 pt-5 font-mono text-xs tracking-[0.06em] text-muted-foreground">
                {service.format}
            </p>
        </div>
    );
}

export default function Consulting({ contactEmail = 'karthick@gigcodes.com', seo, jsonLd }: ConsultingProps) {
    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />

            <SimpleLayout
                eyebrow="consulting"
                title="Visas that clear, and homes that run themselves."
                intro="Three things I get asked about often enough that I now set aside time for them. Sessions are one-on-one, over a call, and you leave with something written down — not just a nice chat."
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
                <div className="border-b border-border/60 pb-6">
                    <p className="label-mono mb-4 flex items-center gap-3">
                        <span className="text-primary/70" data-numeric>
                            01
                        </span>
                        <span aria-hidden="true" className="h-px w-6 bg-primary/40" />
                        how it works
                    </p>
                    <h2 className="display-3 text-foreground">Three steps, no discovery-call theatre</h2>
                </div>

                <Reveal className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3">
                    {[
                        { step: '01', title: 'Tell me the problem', body: 'Send an email with what you are trying to do and roughly when. A few lines is plenty.' },
                        { step: '02', title: 'We book a call', body: 'Sixty minutes, screen shared, working through your actual situation rather than slides.' },
                        { step: '03', title: 'You get it in writing', body: 'A written plan afterwards — the route, the parts list, or the network diagram — so nothing lives only in memory.' },
                    ].map((item) => (
                        <Reveal.Item key={item.step}>
                            <p className="font-mono text-sm text-primary" data-numeric>
                                {item.step}
                            </p>
                            <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.015em] text-foreground">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{item.body}</p>
                        </Reveal.Item>
                    ))}
                </Reveal>
            </Container>

            {/* Contact */}
            <Container className="mt-28 md:mt-36">
                <div className="overflow-hidden rounded-3xl surface-elevated">
                    <div className="terminal-window-header">
                        <span className="terminal-window-dot red" />
                        <span className="terminal-window-dot yellow" />
                        <span className="terminal-window-dot green" />
                        <span className="ml-2 font-mono text-xs text-muted-foreground">contact.sh</span>
                    </div>

                    <div className="p-8 md:p-12">
                        <p className="mb-4 font-mono text-sm text-muted-foreground">
                            <span className="text-primary">$</span> mail karthick <span className="caret" />
                        </p>
                        <h2 className="display-3 max-w-2xl text-foreground">Tell me what you're planning</h2>
                        <p className="prose-measure mt-4 text-base leading-relaxed text-muted-foreground">
                            Email is the fastest way to reach me. Mention which of the three you're after and a rough
                            timeline, and I'll come back with availability.
                        </p>
                        <a
                            href={`mailto:${contactEmail}`}
                            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-sm text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {contactEmail}
                            <span aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                                &rarr;
                            </span>
                        </a>
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
