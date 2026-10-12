import { router } from '@inertiajs/react';
import { Toaster } from '@shared/components/ui/sonner';
import { useEffect } from 'react';
import { toast } from 'sonner';

type Notification = { id: string; kind: 'success' | 'error' | 'warning' | 'info'; message: string };
const seen = new Set<string>();
function publish(notifications: unknown) {
    if (!Array.isArray(notifications)) return;
    for (const item of notifications as Notification[]) {
        if (!item?.id || !item.message || seen.has(item.id)) continue;
        seen.add(item.id);
        if (seen.size > 100) seen.delete(seen.values().next().value!);
        const kind = ['success', 'error', 'warning', 'info'].includes(item.kind) ? item.kind : 'info';
        toast[kind](item.message, { id: item.id });
    }
}
export function AppNotifications({ initial }: { initial: unknown }) {
    useEffect(() => {
        publish(initial);
        return router.on('navigate', ({ detail }) => publish(detail.page.props.notifications));
    }, [initial]);
    return <Toaster richColors position="bottom-right" closeButton />;
}
