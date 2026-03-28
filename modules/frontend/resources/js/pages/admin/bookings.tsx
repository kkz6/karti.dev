import { Head } from '@inertiajs/react';
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
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Consultation Bookings', href: route('admin.bookings.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consultation Bookings" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Consultation Bookings</h2>
                </div>

                <div className="rounded-md border border-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Profession</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slot</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Booked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                            No bookings yet.
                                        </td>
                                    </tr>
                                )}
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 text-muted-foreground">{booking.id}</td>
                                        <td className="px-4 py-3 font-medium">{booking.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{booking.email}</td>
                                        <td className="px-4 py-3">{booking.profession}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {formatDateTime(booking.slot_start)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || ''}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                            {booking.payment_id ? booking.payment_id.slice(0, 12) + '...' : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                            {formatDateTime(booking.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
