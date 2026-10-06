import { Link, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Avatar } from './Avatar';
import { Container } from './Container';
import { MobileNavigation } from './MobileNavigation';
import { isNavigationActive, navigation } from './navigation';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
    const { url } = usePage();
    const isHomePage = url.split(/[?#]/)[0] === '/';
    const { scrollY } = useScroll();
    const reduceMotion = useReducedMotion();
    const stripY = useTransform(scrollY, [0, 88], [0, -44]);
    const backgroundColor = useTransform(scrollY, (position) => {
        const tint = Math.min(Math.max(position / 88, 0), 1) * 90;
        return `color-mix(in oklab, var(--accent) ${tint}%, transparent)`;
    });

    return (
        <>
            <header className="sticky top-0 z-40 py-2">
                <Container>
                    <motion.div
                        style={{ backgroundColor }}
                        className="flex min-h-14 items-center justify-between gap-4 rounded-lg px-3 backdrop-blur-xl sm:px-4"
                    >
                        <Link
                            href="/"
                            aria-label="Karthick — Home"
                            className="text-foreground hover:text-primary focus-visible:outline-primary relative flex h-11 w-24 shrink-0 items-center text-sm font-medium tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                        >
                            <span className="relative block h-11 w-full overflow-hidden" aria-hidden="true">
                                <motion.span
                                    className="absolute inset-x-0 top-0 block will-change-transform"
                                    style={{ y: reduceMotion ? 0 : stripY }}
                                >
                                    <span className="flex h-11 items-center">karti.dev</span>
                                    <span className="flex h-11 items-center">
                                        <img src="/images/avatar.png" alt="" className="ring-border/60 h-9 w-9 rounded-full object-cover ring-1" />
                                    </span>
                                </motion.span>
                            </span>
                        </Link>
                        <nav aria-label="Main" className="hidden lg:block">
                            <ul className="flex items-center gap-5">
                                {navigation.map(({ name, href }) => {
                                    const active = isNavigationActive(url, href);
                                    return (
                                        <li key={href}>
                                            <Link
                                                href={href}
                                                aria-current={active ? 'page' : undefined}
                                                className={clsx(
                                                    'focus-visible:outline-primary relative flex min-h-14 items-center text-xs whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-4',
                                                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                {name}
                                                {active && <span aria-hidden="true" className="bg-primary absolute inset-x-0 bottom-2 h-px" />}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <div className="flex items-center gap-2">
                            <div className="lg:hidden">
                                <MobileNavigation />
                            </div>
                            <ThemeToggle />
                        </div>
                    </motion.div>
                </Container>
            </header>
            {isHomePage && (
                <Container className="pt-8">
                    <Avatar large className="inline-block" />
                </Container>
            )}
        </>
    );
}
