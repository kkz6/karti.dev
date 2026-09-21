import { Link } from '@inertiajs/react';
import { Container } from './Container';
import { NewsletterForm } from './NewsletterForm';

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

const social = [
    { name: 'X', href: 'https://x.com/ikkarti' },
    { name: 'GitHub', href: 'https://github.com/kkz6' },
    { name: 'LinkedIn', href: 'https://linkedin.com/in/ikkarti' },
    { name: 'Email', href: 'mailto:karthick@gigcodes.com' },
];

export function Footer() {
    return (
        <footer className="mt-32">
            <Container.Outer>
                <div className="border-border/70 border-t py-12">
                    <Container.Inner>
                        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
                            <div className="flex w-full max-w-sm min-w-0 flex-col gap-6">
                                <div className="max-w-xs">
                                    <p className="font-display text-foreground text-base font-semibold tracking-[-0.015em]">Karthick</p>
                                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                        Developer and founder in Bangalore. Software, home automation, networks, and a spare room on Airbnb.
                                    </p>
                                </div>
                                <div className="mt-auto">
                                    <NewsletterForm />
                                </div>
                            </div>

                            <div className="flex gap-16 sm:gap-20">
                                <nav aria-label="Footer">
                                    <p className="label-mono mb-4">pages</p>
                                    <ul className="space-y-2.5">
                                        {navigation.map((item) => (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200"
                                                >
                                                    {item.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                <div>
                                    <p className="label-mono mb-4">elsewhere</p>
                                    <ul className="space-y-2.5">
                                        {social.map((item) => (
                                            <li key={item.href}>
                                                <a
                                                    href={item.href}
                                                    target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200"
                                                >
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <p className="border-border/50 text-muted-foreground mt-12 border-t pt-8 font-mono text-xs">
                            <span className="text-primary">&copy;</span> {new Date().getFullYear()} Karthick. All rights reserved.
                        </p>
                    </Container.Inner>
                </div>
            </Container.Outer>
        </footer>
    );
}
