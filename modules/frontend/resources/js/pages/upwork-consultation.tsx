import axios from 'axios';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Container } from '../components/Container';
import { SeoHead, type SeoData } from '../components/SeoHead';
import PublicLayout from '../layouts/public-layout';

interface UpworkConsultationProps {
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
    contactEmail?: string;
}

interface BookingFormData {
    name: string;
    email: string;
    profession: string;
    message: string;
}

interface SlotRange {
    start: string;
    end: string;
}

type Step = 'landing' | 'calendar' | 'confirm';

const PRICE = '1,000';

function useTypingAnimation(lines: unknown[], startDelay = 0) {
    const [visibleLines, setVisibleLines] = useState<number>(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started) {
            return;
        }

        const timer = setTimeout(() => {
            if (visibleLines < lines.length) {
                setVisibleLines(prev => prev + 1);
            }
        }, startDelay + visibleLines * 150);

        return () => clearTimeout(timer);
    }, [visibleLines, lines.length, startDelay, started]);

    return { visibleLines, start: () => setStarted(true) };
}

function HeroSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    const bootLines = [
        { text: '$ karti --service upwork-consultation', type: 'command' as const },
        { text: '> Initializing...', type: 'output' as const },
        { text: '> Loading 3+ years of Upwork experience...', type: 'output' as const },
        { text: '> Ready.', type: 'success' as const },
    ];

    const typing = useTypingAnimation(bootLines, 300);

    useEffect(() => {
        if (isInView) {
            typing.start();
        }
    }, [isInView]);

    return (
        <div ref={ref}>
            <div className="terminal-window">
                <div className="terminal-window-header">
                    <div className="terminal-window-dot red" />
                    <div className="terminal-window-dot yellow" />
                    <div className="terminal-window-dot green" />
                    <span className="ml-2 font-mono text-xs text-muted-foreground">consultation.sh</span>
                </div>
                <div className="p-6 font-mono text-sm">
                    <div className="space-y-2 min-h-[280px] sm:min-h-[260px]">
                        {bootLines.map((line, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={typing.visibleLines > index ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.3 }}
                                className={
                                    line.type === 'command'
                                        ? 'text-primary'
                                        : line.type === 'success'
                                            ? 'text-primary font-bold'
                                            : 'text-muted-foreground'
                                }
                            >
                                {line.text}
                            </motion.div>
                        ))}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={typing.visibleLines >= bootLines.length ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="pt-6 space-y-3"
                        >
                            <p className="text-foreground text-lg sm:text-xl font-display font-medium leading-relaxed">
                                I help freelancers crack Upwork —
                                <br />
                                from zero to first job and beyond.
                            </p>
                            <p className="text-primary font-bold text-base sm:text-lg">
                                <span className="text-muted-foreground font-normal">$</span> &#8377;{PRICE} / session
                                <span className="text-muted-foreground font-normal"> &middot; </span>
                                1 hour
                                <span className="text-muted-foreground font-normal"> &middot; </span>
                                No BS
                            </p>
                            <p className="text-muted-foreground/60 text-xs font-mono">
                                // only 3 sessions per week &mdash; limited availability
                            </p>
                        </motion.div>

                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={typing.visibleLines >= bootLines.length ? { opacity: 1 } : {}}
                            className="inline-block w-2 h-4 bg-primary terminal-cursor mt-4"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TopicsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const topics = [
        { name: 'getting-started/', desc: 'Setting up your profile the right way' },
        { name: 'how-upwork-works/', desc: 'Understanding the platform mechanics' },
        { name: 'dos-and-donts/', desc: 'Mistakes that kill your account early' },
        { name: 'saving-money/', desc: 'Avoiding unnecessary fees and charges' },
        { name: 'income-tax/', desc: 'How freelance income works with tax' },
        { name: 'writing-proposals/', desc: 'Proposals that actually get replies' },
        { name: 'landing-jobs/', desc: 'From proposal to signed contract' },
    ];

    return (
        <div ref={ref}>
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="font-display text-lg font-medium text-foreground mb-6"
            >
                <span className="text-primary">$</span> ls ./what-you-will-learn/
            </motion.h2>

            <div className="space-y-3">
                {topics.map((topic, index) => (
                    <motion.div
                        key={topic.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                            duration: 0.3,
                            delay: 0.2 + index * 0.08,
                        }}
                        className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
                    >
                        <span className="text-primary font-mono text-sm shrink-0 mt-0.5">{'>'}</span>
                        <div>
                            <span className="font-mono text-sm font-medium text-foreground">{topic.name}</span>
                            <p className="text-muted-foreground text-sm mt-0.5">{topic.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function HowItWorksSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const steps = [
        { title: 'Live 1-on-1 session', desc: 'Not a recorded course or a YouTube tutorial' },
        { title: 'My actual Upwork profile', desc: 'Walkthrough on a real, active profile' },
        { title: 'No slides. No templates.', desc: 'Real stuff only — practical and actionable' },
        { title: 'Follow-up support', desc: 'Need more help? Book additional hours' },
    ];

    const meta = [
        { key: 'Duration', value: '1 hour' },
        { key: 'Format', value: 'Google Meet / Zoom' },
        { key: 'Language', value: 'English / Tamil' },
    ];

    return (
        <div ref={ref}>
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="font-display text-lg font-medium text-foreground mb-6"
            >
                <span className="text-primary">$</span> ./how-it-works.sh
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{
                            duration: 0.3,
                            delay: 0.2 + index * 0.1,
                        }}
                        className="p-4 rounded-lg bg-card border border-border/50"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-primary">[{index + 1}/{steps.length}]</span>
                            <span className="font-mono text-sm font-medium text-foreground">{step.title}</span>
                        </div>
                        <p className="text-muted-foreground text-sm pl-8">{step.desc}</p>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.7 }}
                className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm"
            >
                {meta.map((item) => (
                    <div key={item.key} className="flex gap-2">
                        <span className="text-primary">{'>'}</span>
                        <span className="text-muted-foreground">{item.key}:</span>
                        <span className="text-foreground/80">{item.value}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

function PricingSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <div ref={ref}>
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="font-display text-lg font-medium text-foreground mb-6"
            >
                <span className="text-primary">$</span> cat pricing.config
            </motion.h2>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="p-6 rounded-lg bg-card border border-border/50"
            >
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-display text-3xl font-bold text-primary">&#8377;{PRICE}</span>
                    <span className="font-mono text-sm text-muted-foreground">/ session</span>
                </div>
                <p className="text-xs font-mono text-primary/70 mb-4">only 3 sessions per week</p>

                <div className="space-y-2 font-mono text-sm">
                    <div className="flex gap-2">
                        <span className="text-foreground/60">refundable</span>
                        <span className="text-muted-foreground/40">=</span>
                        <span className="text-primary font-bold">false</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-foreground/60">duration</span>
                        <span className="text-muted-foreground/40">=</span>
                        <span className="text-foreground/80">"1 hour"</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-foreground/60">includes</span>
                        <span className="text-muted-foreground/40">=</span>
                        <span className="text-foreground/80">"everything you need to start"</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/30 text-sm text-muted-foreground/50 font-mono">
                    <p># Need more after the first session?</p>
                    <p># Follow-up support charged by the hour.</p>
                </div>
            </motion.div>
        </div>
    );
}

function BookingForm({ onSubmit }: { onSubmit: (data: BookingFormData) => void }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    const [form, setForm] = useState<BookingFormData>({
        name: '',
        email: '',
        profession: '',
        message: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!form.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!form.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = 'Enter a valid email';
        }

        if (!form.profession.trim()) {
            newErrors.profession = 'Tell me what you do';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            onSubmit(form);
        }
    };

    const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors font-mono";

    return (
        <div ref={ref} id="book">
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="font-display text-lg font-medium text-foreground mb-2"
            >
                <span className="text-primary">$</span> book-session --start
            </motion.h2>
            <p className="text-muted-foreground text-sm mb-6 font-mono">
                // tell me about yourself, then pick a time
            </p>

            <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.4 }}
                onSubmit={handleSubmit}
                className="space-y-4"
            >
                <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1.5">name *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your full name"
                        className={inputClass}
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1 font-mono">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1.5">email *</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com"
                        className={inputClass}
                    />
                    {errors.email && <p className="text-destructive text-xs mt-1 font-mono">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1.5">profession *</label>
                    <input
                        type="text"
                        value={form.profession}
                        onChange={e => setForm(f => ({ ...f, profession: e.target.value }))}
                        placeholder="e.g. Web Developer, Designer, Copywriter"
                        className={inputClass}
                    />
                    {errors.profession && <p className="text-destructive text-xs mt-1 font-mono">{errors.profession}</p>}
                </div>

                <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1.5">message <span className="text-muted-foreground/40">(optional)</span></label>
                    <textarea
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="What do you want help with?"
                        rows={3}
                        className={inputClass + ' resize-none'}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-sm font-medium rounded-md transition-all hover:scale-[1.02] glow-pulse"
                >
                    <span className="text-primary-foreground/70">$</span>
                    continue --pick-time
                </button>
            </motion.form>
        </div>
    );
}

function CalendarStep({
    onSelect,
    onBack,
}: {
    onSelect: (slot: SlotRange) => void;
    onBack: () => void;
}) {
    const [slots, setSlots] = useState<Record<string, SlotRange[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weekOffset, setWeekOffset] = useState(0);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fetchSlots = useCallback(async (offset: number) => {
        setLoading(true);
        setError('');

        const start = new Date();
        start.setDate(start.getDate() + offset * 7 + (offset === 0 ? 1 : 0));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        try {
            const { data } = await axios.get('/upwork/slots', {
                params: {
                    start_date: start.toISOString(),
                    end_date: end.toISOString(),
                    timezone,
                },
            });

            setSlots(data.slots || {});
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setError(message || 'Failed to load slots');
        } finally {
            setLoading(false);
        }
    }, [timezone]);

    useEffect(() => {
        fetchSlots(weekOffset);
    }, [weekOffset, fetchSlots]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);

        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (isoStr: string) => {
        const d = new Date(isoStr);

        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });
    };

    const sortedDates = Object.keys(slots).sort();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-medium text-foreground">
                    <span className="text-primary">$</span> pick-a-time
                </h2>
                <button
                    onClick={onBack}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    &larr; back
                </button>
            </div>

            <p className="text-muted-foreground text-xs font-mono mb-4">
                // timezone: {timezone}
            </p>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                    disabled={weekOffset === 0}
                    className="px-3 py-1.5 text-xs font-mono rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                    &larr; prev
                </button>
                <button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    disabled={weekOffset >= 3}
                    className="px-3 py-1.5 text-xs font-mono rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                    next &rarr;
                </button>
            </div>

            {loading && (
                <div className="py-12 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-xs font-mono mt-3">fetching available slots...</p>
                </div>
            )}

            {error && (
                <div className="py-8 text-center">
                    <p className="text-destructive text-sm font-mono">{error}</p>
                    <button
                        onClick={() => fetchSlots(weekOffset)}
                        className="mt-2 text-xs font-mono text-primary hover:underline"
                    >
                        retry
                    </button>
                </div>
            )}

            {!loading && !error && sortedDates.length === 0 && (
                <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm font-mono">no slots available this week</p>
                    <button
                        onClick={() => setWeekOffset(weekOffset + 1)}
                        className="mt-2 text-xs font-mono text-primary hover:underline"
                    >
                        try next week &rarr;
                    </button>
                </div>
            )}

            {!loading && !error && sortedDates.length > 0 && (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <h3 className="font-mono text-sm font-medium text-foreground mb-3">
                                {formatDate(date)}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {slots[date].map((slot) => (
                                    <button
                                        key={slot.start}
                                        onClick={() => onSelect(slot)}
                                        className="px-3 py-2 text-xs font-mono rounded-md border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-colors"
                                    >
                                        {formatTime(slot.start)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function ConfirmStep({
    formData,
    slot,
    onBack,
}: {
    formData: BookingFormData;
    slot: SlotRange;
    onBack: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const formatDateTime = (isoStr: string) => {
        const d = new Date(isoStr);

        return d.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone,
        });
    };

    const handlePay = async () => {
        setLoading(true);
        setError('');

        try {
            // Reserve the slot first
            await axios.post('/upwork/reserve-slot', { slot_start: slot.start });

            // Create payment
            const { data } = await axios.post('/upwork/create-payment', {
                name: formData.name,
                email: formData.email,
                profession: formData.profession,
                message: formData.message,
                slot_start: slot.start,
                timezone,
            });

            if (data.payment_link) {
                window.location.href = data.payment_link;
            } else {
                throw new Error('No payment link received');
            }
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setError(message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-medium text-foreground">
                    <span className="text-primary">$</span> confirm-booking
                </h2>
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                >
                    &larr; back
                </button>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border/50 space-y-4">
                <div className="space-y-3 font-mono text-sm">
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-20 shrink-0">name:</span>
                        <span className="text-foreground">{formData.name}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-20 shrink-0">email:</span>
                        <span className="text-foreground">{formData.email}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-20 shrink-0">role:</span>
                        <span className="text-foreground">{formData.profession}</span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border/30">
                        <span className="text-muted-foreground w-20 shrink-0">when:</span>
                        <span className="text-primary font-medium">{formatDateTime(slot.start)}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-20 shrink-0">duration:</span>
                        <span className="text-foreground">1 hour</span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border/30">
                        <span className="text-muted-foreground w-20 shrink-0">total:</span>
                        <span className="text-primary font-bold text-lg">&#8377;{PRICE}</span>
                    </div>
                </div>
            </div>

            {error && (
                <p className="text-destructive text-xs font-mono mt-4">{error}</p>
            )}

            <button
                onClick={handlePay}
                disabled={loading}
                className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-mono text-sm font-medium rounded-lg transition-all hover:scale-[1.02] glow-pulse disabled:opacity-50 disabled:hover:scale-100"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        processing...
                    </>
                ) : (
                    <>
                        <span className="text-primary-foreground/70">$</span>
                        pay &#8377;{PRICE} --confirm
                    </>
                )}
            </button>
        </motion.div>
    );
}

export default function UpworkConsultation({
    seo,
    jsonLd,
    contactEmail = '',
}: UpworkConsultationProps) {
    const [step, setStep] = useState<Step>('landing');
    const [formData, setFormData] = useState<BookingFormData | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<SlotRange | null>(null);
    const topRef = useRef<HTMLDivElement>(null);

    const scrollToTop = () => {
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFormSubmit = (data: BookingFormData) => {
        setFormData(data);
        setStep('calendar');
        scrollToTop();
    };

    const handleSlotSelect = (slot: SlotRange) => {
        setSelectedSlot(slot);
        setStep('confirm');
        scrollToTop();
    };

    return (
        <PublicLayout>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <Container className="mt-9 mb-24">
                <div ref={topRef} className="max-w-2xl mx-auto space-y-16">
                    {step === 'landing' && (
                        <>
                            <TopicsSection />
                            <HowItWorksSection />
                            <PricingSection />
                            <HeroSection />
                            <BookingForm onSubmit={handleFormSubmit} />
                            {contactEmail && (
                                <p className="text-center text-muted-foreground/40 text-xs font-mono">
                                    // questions? reach out at {contactEmail}
                                </p>
                            )}
                        </>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 'calendar' && (
                            <CalendarStep
                                key="calendar"
                                onSelect={handleSlotSelect}
                                onBack={() => setStep('landing')}
                            />
                        )}

                        {step === 'confirm' && formData && selectedSlot && (
                            <ConfirmStep
                                key="confirm"
                                formData={formData}
                                slot={selectedSlot}
                                onBack={() => setStep('calendar')}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </Container>
        </PublicLayout>
    );
}
