import { Head } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';

interface Booking {
    id: number;
    name: string;
    email: string;
    profession: string;
    message: string | null;
    timezone: string;
    slot_start: string;
    slot_end: string | null;
    status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
    payment_id: string | null;
    calcom_booking_uid: string | null;
    paid_at: string | null;
    created_at: string;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-muted text-muted-foreground',
};

function formatDateTime(isoStr: string) {
    return new Date(isoStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function Bookings({ bookings }: { bookings: Booking[] }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Consultation Bookings', href: route('admin.bookings.index') }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consultation Bookings" />
            <PageContainer className="flex min-h-full flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Consultation Bookings</h2>
                </div>

                <div className="border-border rounded-md border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-muted/50 border-b">
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">#</th>
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">Name</th>
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">Email</th>
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">Profession</th>
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">Slot</th>
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">Status</th>
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">Payment</th>
                                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">Booked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                                            No bookings yet.
                                        </td>
                                    </tr>
                                )}
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="border-border hover:bg-muted/30 border-b last:border-0">
                                        <td className="text-muted-foreground px-4 py-3">{booking.id}</td>
                                        <td className="px-4 py-3 font-medium">{booking.name}</td>
                                        <td className="text-muted-foreground px-4 py-3">{booking.email}</td>
                                        <td className="px-4 py-3">{booking.profession}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(booking.slot_start)}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.status] || ''}`}
                                            >
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                                            {booking.payment_id ? booking.payment_id.slice(0, 12) + '...' : '—'}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">{formatDateTime(booking.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
