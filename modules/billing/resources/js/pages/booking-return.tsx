import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { CircleCheck, Clock3, TriangleAlert } from 'lucide-react';
export default function BookingReturn({
    state,
    needsReview,
    name,
    slotStart,
}: {
    state: string;
    needsReview: boolean;
    name: string;
    slotStart: string;
}) {
    return (
        <main className="bg-muted/30 flex min-h-screen items-start justify-center px-4 py-12 sm:py-20">
            <Head title="Consultation confirmation" />
            <Card className="mx-auto w-full max-w-xl">
                <CardHeader className="items-center gap-4 text-center">
                    <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                        {state === 'confirmed' ? (
                            <CircleCheck className="text-primary size-7" />
                        ) : state === 'needs_review' ? (
                            <TriangleAlert className="size-7" />
                        ) : (
                            <Clock3 className="text-muted-foreground size-7" />
                        )}
                    </div>
                    <CardTitle>
                        {state === 'confirmed'
                            ? 'Consultation confirmed'
                            : needsReview
                              ? 'Confirmation needs review'
                              : 'Awaiting payment verification'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>{name}</p>
                    <p>{slotStart}</p>
                    <p className="text-muted-foreground text-sm">
                        {state === 'confirmed'
                            ? 'Your payment and calendar booking are confirmed.'
                            : 'We are checking your payment and reserving your calendar appointment. Confirmation will appear once both steps are complete.'}
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
