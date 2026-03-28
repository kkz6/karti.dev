import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Container } from '../components/Container';
import PublicLayout from '../layouts/public-layout';

interface BookingConfirmedProps {
    booking?: Record<string, unknown> | null;
    name?: string;
    email?: string;
    slotStart?: string;
    timezone?: string;
    paymentId?: string;
}

function formatDateTime(isoStr: string, timezone: string) {
    const d = new Date(isoStr);

    return d.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
    });
}

export default function BookingConfirmed({
    name,
    email,
    slotStart,
    timezone = 'Asia/Kolkata',
    paymentId,
}: BookingConfirmedProps) {
    const hasBooking = !!(name && email && slotStart);

    return (
        <PublicLayout>
            <Head title="Booking Confirmed" />
            <Container className="mt-9 mb-24">
                <div className="max-w-2xl mx-auto">
                    {hasBooking ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="font-display text-xl font-medium text-foreground mb-2">
                                    <span className="text-primary">$</span> booking --status
                                    <span className="text-primary ml-2">confirmed</span>
                                </h1>
                                <p className="text-muted-foreground text-sm font-mono">
                                    // payment received. you're all set.
                                </p>
                            </div>

                            <div className="p-6 rounded-lg bg-card border border-border/50 space-y-3 font-mono text-sm">
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground w-20 shrink-0">name:</span>
                                    <span className="text-foreground">{name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground w-20 shrink-0">email:</span>
                                    <span className="text-foreground">{email}</span>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-border/30">
                                    <span className="text-muted-foreground w-20 shrink-0">when:</span>
                                    <span className="text-primary font-medium">{formatDateTime(slotStart!, timezone)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground w-20 shrink-0">duration:</span>
                                    <span className="text-foreground">1 hour</span>
                                </div>
                                {paymentId && (
                                    <div className="flex gap-2 pt-2 border-t border-border/30">
                                        <span className="text-muted-foreground w-20 shrink-0">ref:</span>
                                        <span className="text-muted-foreground/60 text-xs">{paymentId}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 font-mono text-sm text-muted-foreground">
                                <p><span className="text-primary">{'>'}</span> Check your email for the calendar invite.</p>
                                <p><span className="text-primary">{'>'}</span> The meeting link will be in the invite.</p>
                                <p><span className="text-primary">{'>'}</span> See you soon!</p>
                            </div>

                            <a
                                href="/"
                                className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                &larr; back to homepage
                            </a>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center py-16 space-y-4"
                        >
                            <h1 className="font-display text-lg font-medium text-foreground">
                                <span className="text-primary">$</span> booking --status
                                <span className="text-muted-foreground ml-2">unknown</span>
                            </h1>
                            <p className="text-muted-foreground text-sm font-mono">
                                // no booking data found. session may have expired.
                            </p>
                            <a
                                href="/upwork"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-sm font-medium rounded-md transition-all hover:scale-[1.02] mt-4"
                            >
                                <span className="text-primary-foreground/70">$</span>
                                try-again
                            </a>
                        </motion.div>
                    )}
                </div>
            </Container>
        </PublicLayout>
    );
}
