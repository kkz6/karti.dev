import { Container } from '@frontend/components/Container';
import { SeoData, SeoHead } from '@frontend/components/SeoHead';
import { TurnstileWidget } from '@frontend/components/TurnstileWidget';
import PublicLayout from '@frontend/layouts/public-layout';
import { useForm } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { CheckCircle2, Clock3, Mail, Send, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Topic = { value: string; label: string };
type ContactStatus = { message: string; reference: string } | null;

type ContactFormData = {
    name: string;
    email: string;
    topic: string;
    subject: string;
    message: string;
    source_url: string;
    website: string;
    started_at: string;
    turnstile_token: string;
};

type ContactPageProps = {
    topics: Topic[];
    defaultTopic: string;
    contactForm: { startedAt: string };
    captcha: { enabled: boolean; siteKey: string | null };
    status: ContactStatus;
    seo?: SeoData;
};

const inputClass =
    'mt-2 w-full rounded-xl border border-border/80 bg-background/75 px-4 py-3 text-[0.9375rem] text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60';

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="text-destructive mt-2 text-sm" role="alert">
            {message}
        </p>
    ) : null;
}

export default function Contact({ topics, defaultTopic, contactForm, captcha, status, seo }: ContactPageProps) {
    const [captchaVersion, setCaptchaVersion] = useState(0);
    const [captchaMessage, setCaptchaMessage] = useState<string | null>(null);
    const form = useForm<ContactFormData>({
        name: '',
        email: '',
        topic: defaultTopic,
        subject: '',
        message: '',
        source_url: typeof window === 'undefined' ? '' : window.location.href,
        website: '',
        started_at: contactForm.startedAt,
        turnstile_token: '',
    });

    function resetCaptcha(message: string | null = null) {
        form.setData('turnstile_token', '');
        setCaptchaMessage(message);
        setCaptchaVersion((version) => version + 1);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setCaptchaMessage(null);
        form.post(route('contact.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('name', 'email', 'subject', 'message', 'website', 'turnstile_token'),
            onError: () => {
                if (captcha.enabled) resetCaptcha();
            },
        });
    }

    return (
        <PublicLayout>
            <SeoHead seo={seo} />

            <Container className="mt-16 sm:mt-24">
                <div className="grid gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-20">
                    <header className="lg:pt-6">
                        <p className="label-mono mb-5 flex items-center gap-2">
                            <span aria-hidden="true" className="bg-primary/50 h-px w-6" />
                            contact
                        </p>
                        <h1 className="display-2 text-foreground max-w-xl">Tell me what you are working on.</h1>
                        <p className="prose-measure text-muted-foreground mt-6 text-lg leading-relaxed">
                            Share the context, the outcome you need, and any useful timeline. A thoughtful first message makes the next step much
                            easier.
                        </p>

                        <dl className="border-border/70 mt-10 space-y-6 border-t pt-8">
                            <div className="flex gap-4">
                                <Clock3 className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                                <div>
                                    <dt className="font-display text-foreground font-semibold">A clear response</dt>
                                    <dd className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                        I usually reply with availability or the next useful question.
                                    </dd>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                                <div>
                                    <dt className="font-display text-foreground font-semibold">Your details stay private</dt>
                                    <dd className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                        Contact details are used only to respond to this message.
                                    </dd>
                                </div>
                            </div>
                        </dl>
                    </header>

                    <section aria-labelledby="contact-form-heading" className="surface-elevated overflow-hidden rounded-3xl">
                        <div className="border-border/70 border-b px-6 py-5 sm:px-8">
                            <div className="flex items-center gap-3">
                                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
                                    <Mail className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="contact-form-heading" className="font-display text-foreground text-lg font-semibold">
                                        Send a message
                                    </h2>
                                    <p className="text-muted-foreground mt-0.5 text-sm">All fields are required.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {status ? (
                                <div className="border-primary/25 bg-primary/8 mb-7 rounded-2xl border p-5" role="status">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                                        <div>
                                            <p className="text-foreground font-medium">Message received</p>
                                            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{status.message}</p>
                                            <p className="text-muted-foreground mt-2 font-mono text-xs">Reference {status.reference}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <form onSubmit={submit} noValidate>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <label className="text-foreground block text-sm font-medium">
                                        Name
                                        <input
                                            className={inputClass}
                                            value={form.data.name}
                                            onChange={(event) => form.setData('name', event.target.value)}
                                            autoComplete="name"
                                            maxLength={120}
                                            aria-invalid={Boolean(form.errors.name)}
                                        />
                                        <FieldError message={form.errors.name} />
                                    </label>

                                    <label className="text-foreground block text-sm font-medium">
                                        Email
                                        <input
                                            className={inputClass}
                                            type="email"
                                            value={form.data.email}
                                            onChange={(event) => form.setData('email', event.target.value)}
                                            autoComplete="email"
                                            inputMode="email"
                                            maxLength={254}
                                            aria-invalid={Boolean(form.errors.email)}
                                        />
                                        <FieldError message={form.errors.email} />
                                    </label>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="contact-topic" className="text-foreground block text-sm font-medium">
                                            What is this about?
                                        </label>
                                        <Select value={form.data.topic} onValueChange={(value) => form.setData('topic', value)}>
                                            <SelectTrigger
                                                id="contact-topic"
                                                aria-invalid={Boolean(form.errors.topic)}
                                                aria-describedby={form.errors.topic ? 'contact-topic-error' : undefined}
                                                className="border-border/80 bg-background/75 focus-visible:border-primary/60 focus-visible:ring-primary/10 mt-2 min-h-12 rounded-xl px-4 py-3 text-[0.9375rem] shadow-sm focus-visible:ring-4"
                                            >
                                                <SelectValue placeholder="Choose a topic" />
                                            </SelectTrigger>
                                            <SelectContent className="border-border/80 rounded-xl p-1 shadow-lg">
                                                {topics.map((topic) => (
                                                    <SelectItem key={topic.value} value={topic.value} className="rounded-lg py-2.5 pr-9 pl-3">
                                                        {topic.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.topic ? (
                                            <p id="contact-topic-error" className="text-destructive mt-2 text-sm" role="alert">
                                                {form.errors.topic}
                                            </p>
                                        ) : null}
                                    </div>

                                    <label className="text-foreground block text-sm font-medium sm:col-span-2">
                                        Subject
                                        <input
                                            className={inputClass}
                                            value={form.data.subject}
                                            onChange={(event) => form.setData('subject', event.target.value)}
                                            maxLength={160}
                                            placeholder="A short summary of your message"
                                            aria-invalid={Boolean(form.errors.subject)}
                                        />
                                        <FieldError message={form.errors.subject} />
                                    </label>

                                    <label className="text-foreground block text-sm font-medium sm:col-span-2">
                                        Message
                                        <textarea
                                            className={`${inputClass} min-h-44 resize-y leading-relaxed`}
                                            value={form.data.message}
                                            onChange={(event) => form.setData('message', event.target.value)}
                                            maxLength={5000}
                                            placeholder="Include the useful context, desired outcome, and timeline."
                                            aria-invalid={Boolean(form.errors.message)}
                                        />
                                        <div className="mt-2 flex items-start justify-between gap-4">
                                            <FieldError message={form.errors.message} />
                                            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                                                {form.data.message.length}/5000
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <div className="absolute top-auto -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
                                    <label htmlFor="contact-website">Website</label>
                                    <input
                                        id="contact-website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={form.data.website}
                                        onChange={(event) => form.setData('website', event.target.value)}
                                    />
                                </div>

                                {captcha.enabled && captcha.siteKey ? (
                                    <div className="mt-6">
                                        <TurnstileWidget
                                            key={captchaVersion}
                                            siteKey={captcha.siteKey}
                                            onVerify={(token) => {
                                                form.setData('turnstile_token', token);
                                                setCaptchaMessage(null);
                                            }}
                                            onExpire={() => resetCaptcha('The security check expired. Please complete it again.')}
                                            onError={() => {
                                                form.setData('turnstile_token', '');
                                                setCaptchaMessage('The security check could not load. Please refresh the page and try again.');
                                            }}
                                        />
                                        <FieldError message={form.errors.turnstile_token ?? captchaMessage ?? undefined} />
                                    </div>
                                ) : null}

                                <div className="border-border/70 mt-7 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
                                        By sending this form, you agree that I may use these details to reply to your enquiry.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="group bg-primary text-primary-foreground inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 font-mono text-sm font-medium transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                                    >
                                        {form.processing ? (
                                            <>
                                                <span
                                                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                                                    aria-hidden="true"
                                                />
                                                Sending
                                            </>
                                        ) : (
                                            <>
                                                Send message
                                                <Send className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </Container>
        </PublicLayout>
    );
}
