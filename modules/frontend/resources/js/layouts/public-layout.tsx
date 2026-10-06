import { SiteIdentityHead } from '@shared/components/site-identity-head';
import { useEffect, type ReactNode } from 'react';
import { CursorGlow } from '../components/CursorGlow';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { PageTransition } from '../components/PageTransition';
import { ScrollProgress } from '../components/ScrollProgress';

interface PublicLayoutProps {
    children: ReactNode;
    reading?: boolean;
}

// Fine-grain film noise, inlined so it costs no request
const noiseSvg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
        <filter id='noise' x='0' y='0'>
            <feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/>
            <feColorMatrix type='saturate' values='0'/>
        </filter>
        <rect width='100%' height='100%' filter='url(#noise)' opacity='1'/>
    </svg>
`
    .replace(/\s+/g, ' ')
    .trim();

const noiseUrl = `url("data:image/svg+xml,${encodeURIComponent(noiseSvg)}")`;

export default function PublicLayout({ children, reading = false }: PublicLayoutProps) {
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);

        document.documentElement.classList.toggle('dark', isDark);
    }, []);

    return (
        <div className={`public-site ${reading ? 'public-reading' : ''} bg-background relative flex min-h-dvh w-full flex-col`}>
            <SiteIdentityHead />
            <a href="#main" className="skip-link">
                Skip to content
            </a>

            <ScrollProgress />
            {!reading && <CursorGlow />}

            {!reading && (
                <>
                    {/* Film grain, sits above content but never intercepts pointer events */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none fixed inset-0 z-[70] opacity-[0.035] dark:opacity-[0.028]"
                        style={{ backgroundImage: noiseUrl, backgroundRepeat: 'repeat' }}
                    />

                    {/* Drifting mesh so the top of the page never reads as flat charcoal */}
                    <div
                        aria-hidden="true"
                        className="mesh-ambient pointer-events-none fixed inset-x-0 top-0 z-0 h-[42rem] opacity-70 dark:opacity-50"
                    />
                </>
            )}

            <Header />

            <main id="main" className="relative z-10 flex-auto">
                <PageTransition>{children}</PageTransition>
            </main>

            <Footer />
        </div>
    );
}
