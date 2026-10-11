import { Toaster } from '@shared/components/ui/sonner';
import { useAppearance } from '@shared/hooks/use-appearance';
import { useEffect } from 'react';
import { toast } from 'sonner';

/** One brief viewport notification; never inserts a banner into the invoice document. */
export function InvoiceNotification({ message, response }: { message?: string; response?: unknown }) {
    const { appearance } = useAppearance();
    useEffect(() => {
        if (message) toast.success(message, { id: 'invoice-feedback', duration: 2500 });
    }, [message, response]);
    return <Toaster richColors position="bottom-right" theme={appearance} closeButton />;
}
