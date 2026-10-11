import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@shared/components/app-logo-icon';
import { SiteIdentityHead } from '@shared/components/site-identity-head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { PropsWithChildren } from 'react';
interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}
export default function AuthLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { name } = usePage<{ name?: string }>().props;
    return (
        <main className="admin-auth bg-background flex min-h-svh items-center justify-center px-4 py-10 sm:px-6">
            <SiteIdentityHead />
            <div className="w-full max-w-sm space-y-6">
                <Link href={route('home')} className="mx-auto flex w-fit items-center justify-center gap-2.5 text-sm font-semibold">
                    <AppLogoIcon className="size-8" />
                    <span>{name || 'Karti.dev'}</span>
                </Link>
                <Card className="rounded-xl shadow-sm">
                    <CardHeader className="gap-2 px-6 pt-7 pb-6 text-center">
                        <CardTitle className="text-2xl leading-tight tracking-tight">{title}</CardTitle>
                        <CardDescription className="text-sm leading-6">{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-7">{children}</CardContent>
                </Card>
                <p className="text-muted-foreground text-center text-xs leading-5">Secure access to your Karti.dev account.</p>
            </div>
        </main>
    );
}
