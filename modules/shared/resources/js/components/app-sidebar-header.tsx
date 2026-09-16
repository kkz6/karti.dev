import { Link, usePage } from '@inertiajs/react';
import AppearanceToggleDropdown from '@shared/components/appearance-dropdown';
import { Breadcrumbs } from '@shared/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Separator } from '@shared/components/ui/separator';
import { SidebarTrigger } from '@shared/components/ui/sidebar';
import { UserMenuContent } from '@shared/components/user-menu-content';
import { useInitials } from '@shared/hooks/use-initials';
import { type BreadcrumbItem, type SharedData } from '@shared/types';
import { ArrowUpRight } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

    return (
        <header className="relative z-30 flex h-14 shrink-0 items-center gap-4 bg-[#252528] px-3 text-white md:px-4">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-40 focus:bg-white focus:p-2 focus:text-black"
            >
                Skip to content
            </a>
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="text-white/65 hover:bg-white/10 hover:text-white" />

                <Link
                    href="/dashboard"
                    prefetch
                    className="flex shrink-0 items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                    <img src="/images/avatar.png" alt="" className="size-7 rounded-sm object-cover" />
                    <span className="text-sm font-semibold tracking-tight">karti.dev</span>
                </Link>

                <Separator orientation="vertical" className="hidden !h-5 bg-white/15 sm:block" />

                {breadcrumbs.length > 0 && (
                    <div className="hidden min-w-0 overflow-hidden md:block [&_[data-slot=breadcrumb-link]]:text-white/70 [&_[data-slot=breadcrumb-link]]:hover:text-white [&_[data-slot=breadcrumb-list]]:flex-nowrap [&_[data-slot=breadcrumb-list]]:whitespace-nowrap [&_[data-slot=breadcrumb-list]]:text-white/60 [&_[data-slot=breadcrumb-page]]:text-white [&_[data-slot=breadcrumb-separator]]:text-white/40">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                )}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1">
                <Button asChild variant="ghost" size="sm" className="hidden gap-1.5 text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex">
                    <a href="/" target="_blank" rel="noopener noreferrer">
                        View site
                        <ArrowUpRight className="size-3.5" />
                    </a>
                </Button>

                <AppearanceToggleDropdown className="[&_button]:text-white/70 [&_button]:hover:bg-white/10 [&_button]:hover:text-white" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="ml-1 size-9 rounded-sm p-0.5 hover:bg-white/10">
                            <Avatar className="size-7 rounded-sm">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="rounded-sm bg-white/15 text-xs text-white">{getInitials(auth.user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Open user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
