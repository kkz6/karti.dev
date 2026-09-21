import { useEffect, useRef } from 'react';

type TurnstileApi = {
    render: (
        element: HTMLElement,
        options: {
            sitekey: string;
            action: string;
            theme: 'auto';
            size: 'compact' | 'flexible';
            appearance: 'interaction-only';
            callback: (token: string) => void;
            'error-callback': () => void;
            'expired-callback': () => void;
        },
    ) => string;
    remove: (widgetId: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

type TurnstileWidgetProps = {
    siteKey: string;
    onVerify: (token: string) => void;
    onExpire: () => void;
    onError: () => void;
};

const scriptId = 'cloudflare-turnstile-script';

export function TurnstileWidget({ siteKey, onVerify, onExpire, onError }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });

    useEffect(() => {
        callbacksRef.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    useEffect(() => {
        let disposed = false;

        const render = () => {
            if (disposed || !containerRef.current || !window.turnstile || widgetIdRef.current !== null) return;

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                action: 'contact',
                theme: 'auto',
                size: window.matchMedia('(max-width: 370px)').matches ? 'compact' : 'flexible',
                appearance: 'interaction-only',
                callback: (token) => callbacksRef.current.onVerify(token),
                'error-callback': () => callbacksRef.current.onError(),
                'expired-callback': () => callbacksRef.current.onExpire(),
            });
        };

        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (window.turnstile) {
            render();
        } else if (script) {
            script.addEventListener('load', render);
        } else {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.addEventListener('load', render);
            document.head.appendChild(script);
        }

        return () => {
            disposed = true;
            script?.removeEventListener('load', render);
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [siteKey]);

    return <div ref={containerRef} className="min-h-0 max-w-full" aria-label="Security check" />;
}
