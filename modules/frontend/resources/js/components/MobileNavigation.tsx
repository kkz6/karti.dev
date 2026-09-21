import { Link } from '@inertiajs/react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

const navigation = [
    { name: 'About', href: '/about' },
    { name: 'Consulting', href: '/consulting' },
    { name: 'Articles', href: '/articles' },
    { name: 'Projects', href: '/projects' },
    { name: 'Speaking', href: '/speaking' },
    { name: 'Photography', href: '/photography' },
    { name: 'Uses', href: '/uses' },
    { name: 'Contact', href: '/contact' },
];

function MobileNavItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
    return (
        <li>
            <Link href={href} className="hover:text-primary block py-2 font-mono text-sm transition" onClick={onClick}>
                <span className="text-primary mr-2">{'>'}</span>
                {children}
            </Link>
        </li>
    );
}

export function MobileNavigation(props: React.ComponentPropsWithoutRef<'div'>) {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <div {...props} className="pointer-events-auto relative">
            <button
                type="button"
                onClick={handleToggle}
                className="group glass-nav-pattern text-foreground hover:bg-muted/30 pointer-events-auto relative z-10 flex items-center rounded-xl px-4 py-2.5 font-mono text-sm transition"
            >
                Menu
                <ChevronDown
                    className={clsx(
                        'ml-3 h-auto w-2 stroke-zinc-500 transition-transform duration-200 group-hover:stroke-zinc-700 dark:group-hover:stroke-zinc-400',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50">
                        <motion.div
                            className="absolute inset-0 bg-zinc-800/40 backdrop-blur dark:bg-black/80"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            onClick={handleClose}
                        />
                        <motion.div
                            className="glass-nav-pattern fixed inset-x-4 top-8 z-50 origin-top rounded-2xl p-8 shadow-2xl"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                            <div className="flex flex-row-reverse items-center justify-between">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="hover:text-primary -m-1 p-1 transition"
                                    aria-label="Close menu"
                                >
                                    <X className="text-muted-foreground h-6 w-6" />
                                </button>
                                <h2 className="text-muted-foreground font-mono text-sm">
                                    <span className="text-primary">$</span> ./navigate
                                </h2>
                            </div>
                            <nav className="mt-6">
                                <ul className="divide-border/50 text-foreground -my-2 divide-y text-base">
                                    {navigation.map((item) => (
                                        <MobileNavItem key={item.href} href={item.href} onClick={handleClose}>
                                            {item.name}
                                        </MobileNavItem>
                                    ))}
                                </ul>
                            </nav>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
