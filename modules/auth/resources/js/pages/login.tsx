import { usePasskeyAuth } from '@auth/hooks/use-passkey-auth';
import { canUsePasskeys } from '@auth/lib/passkey-utils';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@shared/components/input-error';
import TextLink from '@shared/components/text-link';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import AuthLayout from '@shared/layouts/auth-layout';
import axios from 'axios';
import { Fingerprint, LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
type LoginForm = { email: string; password: string; remember: boolean };
export default function Login({ canResetPassword }: { status?: string; canResetPassword: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({ email: '', password: '', remember: false });
    const [passkeyAvailable, setPasskeyAvailable] = useState(false);
    const supported = canUsePasskeys();
    const { isLoading: passkeyLoading, error: passkeyError, authenticateUser } = usePasskeyAuth();
    useEffect(() => {
        setPasskeyAvailable(false);
        if (!supported || !/^\S+@\S+\.\S+$/.test(data.email)) return;
        const abort = new AbortController();
        const timer = setTimeout(() => {
            axios
                .post(route('login.check-status'), { email: data.email }, { signal: abort.signal })
                .then(({ data: account }) => setPasskeyAvailable(!!account.hasPasskeys))
                .catch(() => {
                    if (!abort.signal.aborted) setPasskeyAvailable(false);
                });
        }, 400);
        return () => {
            clearTimeout(timer);
            abort.abort();
        };
    }, [data.email, supported]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };
    return (
        <AuthLayout title="Welcome back" description="Sign in to your Karti.dev account">
            <Head title="Log in" />
            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        placeholder="you@example.com"
                        required
                        disabled={processing || passkeyLoading}
                        aria-invalid={!!errors.email}
                    />
                    <InputError message={errors.email} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="password">Password</Label>
                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="text-xs">
                                Forgot password?
                            </TextLink>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={data.password}
                        onChange={(event) => setData('password', event.target.value)}
                        required
                        disabled={processing || passkeyLoading}
                        aria-invalid={!!errors.password}
                    />
                    <InputError message={errors.password} />
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="remember"
                        checked={data.remember}
                        onCheckedChange={(value) => setData('remember', value === true)}
                        disabled={processing || passkeyLoading}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">
                        Remember me
                    </Label>
                </div>
                <Button type="submit" className="h-9 w-full" disabled={processing || passkeyLoading}>
                    {processing ? (
                        <>
                            <LoaderCircle className="size-4 animate-spin" />
                            Signing in…
                        </>
                    ) : (
                        'Log in'
                    )}
                </Button>
                {passkeyAvailable && (
                    <div className="space-y-3">
                        <div className="text-muted-foreground flex items-center gap-3 text-xs">
                            <span className="bg-border h-px flex-1" />
                            Or use a passkey
                            <span className="bg-border h-px flex-1" />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full"
                            disabled={processing || passkeyLoading}
                            onClick={() => void authenticateUser(data.email)}
                        >
                            {passkeyLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Fingerprint className="size-4" />}Sign in with
                            passkey
                        </Button>
                        <InputError message={passkeyError ?? undefined} />
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}
