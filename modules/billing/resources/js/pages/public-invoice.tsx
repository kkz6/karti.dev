import { Head, router } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { BillingSummary } from '../components/billing-summary';
import { InvoiceDocument } from '../components/invoice-document';
import type { InvoiceData } from '../invoice-types';
import type { Settlement } from '../payment-types';
export default function PublicInvoice({
    invoice,
    settlement,
    pdfUrl,
    checkoutUrl,
}: {
    invoice: InvoiceData;
    settlement: Settlement;
    pdfUrl: string;
    checkoutUrl: string | null;
}) {
    return (
        <main className="bg-muted/30 min-h-screen px-4 py-8 sm:py-12">
            <Head title={invoice.formatted_number ?? 'Invoice'}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-semibold">{invoice.formatted_number}</h1>
                        <Badge variant="secondary">
                            {settlement.state === 'partial'
                                ? 'Partially paid'
                                : settlement.state === 'settled'
                                  ? 'Settled with credit'
                                  : settlement.state === 'paid'
                                    ? 'Paid'
                                    : 'Unpaid'}
                        </Badge>
                    </div>
                    <Button variant="outline" asChild>
                        <a href={pdfUrl}>Download PDF</a>
                    </Button>
                </div>
                {checkoutUrl && <Button onClick={() => router.post(checkoutUrl, { request_key: crypto.randomUUID() })}>Pay online</Button>}
                <BillingSummary
                    items={[
                        { label: 'Invoice total', value: invoice.totals.total, currency: invoice.currency },
                        { label: 'Payments received', value: settlement.paid, currency: invoice.currency },
                        { label: 'Credit applied', value: settlement.credited, currency: invoice.currency },
                        { label: 'Amount due', value: settlement.balance, currency: invoice.currency, emphasis: true },
                    ]}
                />
                <InvoiceDocument invoice={invoice} />
            </div>
        </main>
    );
}
