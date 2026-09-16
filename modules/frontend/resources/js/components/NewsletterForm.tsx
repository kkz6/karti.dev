import { useForm, usePage } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { type FormEvent } from 'react';

export function NewsletterForm() {
    const { newsletterForm, newsletterStatus } = usePage<{
        newsletterForm: { started_at: string } | null;
        newsletterStatus?: string;
    }>().props;
    const form = useForm({ email: '', website: '', started_at: '' });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, started_at: newsletterForm?.started_at ?? '' }));
        form.post(route('newsletter.subscribe'), { preserveScroll: true, onSuccess: () => form.reset('email') });
    };
    const error = form.errors.email || form.errors.website || form.errors.started_at;
    return (
        <form onSubmit={submit} aria-labelledby="newsletter-heading" className="w-full min-w-0">
            <div className="mb-3">
                <h2 id="newsletter-heading" className="text-foreground text-sm font-medium">
                    Newsletter
                </h2>
                <p id="newsletter-description" className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    Get new articles on software, travel, and life by email.
                </p>
            </div>
            <label htmlFor="newsletter-email" className="sr-only">
                email address
            </label>
            <div className="flex gap-2">
                <input
                    id="newsletter-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.data.email}
                    onChange={(event) => form.setData('email', event.target.value)}
                    placeholder="you@example.com"
                    required
                    maxLength={254}
                    aria-invalid={!!error}
                    aria-describedby="newsletter-description newsletter-feedback"
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 h-11 w-full min-w-0 flex-auto rounded-lg border px-3 py-2.5 font-mono text-sm transition-colors duration-200 focus:outline-none"
                />
                <Button type="submit" disabled={form.processing} className="h-11 shrink-0 rounded-lg px-4 font-mono text-sm">
                    {form.processing ? 'Subscribing…' : 'Subscribe'}
                </Button>
            </div>
            <div className="hidden" aria-hidden="true">
                <label htmlFor="newsletter-website">Website</label>
                <input
                    id="newsletter-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.data.website}
                    onChange={(event) => form.setData('website', event.target.value)}
                />
            </div>
            <div id="newsletter-feedback" className="text-sm empty:hidden [&:not(:empty)]:mt-3" aria-live="polite">
                {error ? (
                    <p role="alert" className="text-destructive">
                        {error}
                    </p>
                ) : newsletterStatus ? (
                    <p role="status">{newsletterStatus}</p>
                ) : null}
            </div>
        </form>
    );
}
