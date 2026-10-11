import { Head } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { CircleCheck, Clock3, TriangleAlert } from 'lucide-react';
export default function PaymentReturn({ state, invoiceUrl }: { state: string; invoiceUrl: string }) {
    return (
        <main className="bg-muted/30 flex min-h-screen items-start justify-center px-4 py-12 sm:py-20">
            <Head title="Payment confirmation" />
            <Card className="mx-auto w-full max-w-xl">
                <CardHeader className="items-center gap-4 text-center">
                    <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                        {state === 'paid' ? (
                            <CircleCheck className="text-primary size-7" />
                        ) : state === 'needs_review' ? (
                            <TriangleAlert className="size-7" />
                        ) : (
                            <Clock3 className="text-muted-foreground size-7" />
                        )}
                    </div>
                    <CardTitle>
                        {state === 'paid' ? 'Payment confirmed' : state === 'needs_review' ? 'Payment needs review' : 'Awaiting payment verification'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <p className="text-muted-foreground text-sm">
                        {state === 'paid'
                            ? 'Your verified payment has been recorded.'
                            : 'We are checking your payment with the provider. Your invoice balance will update once verification is complete.'}
                    </p>
                    <Button variant="outline" asChild>
                        <a href={invoiceUrl}>Return to invoice</a>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
