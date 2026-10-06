import { Link, usePage } from '@inertiajs/react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog';
import clsx from 'clsx';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { isNavigationActive, navigation } from './navigation';

export function MobileNavigation() {
    const { url } = usePage();
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground focus-visible:outline-primary inline-flex min-h-11 items-center gap-2 px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <Menu aria-hidden="true" className="h-4 w-4" />
                    Menu
                </button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="public-site bg-card top-20 max-w-sm translate-y-0 gap-5 rounded-xl p-6">
                <DialogTitle className="text-sm font-medium">Navigation</DialogTitle>
                <nav aria-label="Main">
                    <ul className="divide-border/60 divide-y">
                        {navigation.map(({ name, href }) => {
                            const active = isNavigationActive(url, href);
                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        aria-current={active ? 'page' : undefined}
                                        onClick={() => setOpen(false)}
                                        className={clsx(
                                            'focus-visible:outline-primary flex min-h-11 items-center justify-between py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                                            active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {name}
                                        {active && <span aria-hidden="true" className="bg-primary h-1 w-1 rounded-full" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </DialogContent>
        </Dialog>
    );
}
