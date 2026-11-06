export function deliveryTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Time unavailable'
        : new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZoneName: 'short',
          }).format(date);
}

export type DeliveryEcho = {
    private: (channel: string) => {
        listen: (event: string, callback: () => void) => void;
        stopListening: (event: string, callback: () => void) => void;
    };
};

export function watchDelivery(echo: DeliveryEcho | undefined, enabled: boolean, invoiceId: number, refresh: () => void): (() => void) | undefined {
    if (!enabled || !echo) return;
    const channel = echo.private(`billing.invoices.${invoiceId}`);
    channel.listen('.invoice.delivery.updated', refresh);
    return () => channel.stopListening('.invoice.delivery.updated', refresh);
}
