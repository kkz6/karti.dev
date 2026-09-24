import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import PublicLayout from '../layouts/public-layout';

export default function Newsletter({ mode, actionUrl }: { mode: 'confirm' | 'confirmed' | 'unsubscribe' | 'unsubscribed'; actionUrl: string }) {
    const form = useForm({});
    const titles = {
        confirm: 'Confirm your subscription',
        confirmed: 'You’re subscribed',
        unsubscribe: 'Unsubscribe from the newsletter',
        unsubscribed: 'You’re unsubscribed',
    };
    const descriptions = {
        confirm: 'Confirm that you want occasional writing and updates in your inbox.',
        confirmed: 'Your email is verified. You can unsubscribe using the link in any newsletter.',
        unsubscribe: 'You’ll stop receiving newsletter emails. You can subscribe again at any time.',
        unsubscribed: 'You won’t receive further newsletters.',
    };
    const actionable = mode === 'confirm' || mode === 'unsubscribe';
    return (
        <PublicLayout>
            <Head title={titles[mode]}>
                <meta name="robots" content="noindex,nofollow" />
                <meta name="referrer" content="no-referrer" />
            </Head>
            <section className="mx-auto max-w-xl space-y-6 px-6 py-20">
                <h1 className="text-3xl font-semibold">{titles[mode]}</h1>
                <p className="text-muted-foreground">{descriptions[mode]}</p>
                {actionable && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(actionUrl);
                        }}
                    >
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Please wait…' : mode === 'confirm' ? 'Confirm subscription' : 'Unsubscribe'}
                        </Button>
                    </form>
                )}
                <Link href={route('home')} className="block underline underline-offset-4">
                    Back to home
                </Link>
            </section>
        </PublicLayout>
    );
}
