import { BillingSelect, BillingSelectItem } from '@billing/components/billing-select';
import { Head, router } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent } from '@shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import AppLayout from '@shared/layouts/app-layout';
interface Booking {
    id: number;
    name: string;
    email: string;
    profession: string;
    slot_start: string;
    status: string;
    fulfillment_state: string;
    billing_customer_id: number | null;
    paid_at: string | null;
}
export default function Bookings({
    bookings,
    customers,
    canAssociate,
}: {
    bookings: Booking[];
    customers: { id: number; display_name: string }[];
    canAssociate: boolean;
}) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Consultation bookings', href: route('admin.bookings.index') }]}>
            <Head title="Consultation bookings" />
            <PageContainer className="space-y-6">
                <h1 className="text-2xl font-semibold">Consultation bookings</h1>
                <p className="text-muted-foreground text-sm">
                    Customer associations are chosen explicitly. Payment and calendar verification control confirmation.
                </p>
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {['Name', 'Email', 'Date', 'Status', 'Calendar verification', 'Customer'].map((t) => (
                                        <TableHead key={t}>{t}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell>{b.name}</TableCell>
                                        <TableCell>{b.email}</TableCell>
                                        <TableCell>{b.slot_start}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{b.status}</Badge>
                                        </TableCell>
                                        <TableCell>{b.fulfillment_state}</TableCell>
                                        <TableCell>
                                            {canAssociate ? (
                                                <BillingSelect
                                                    value={b.billing_customer_id ? String(b.billing_customer_id) : ''}
                                                    placeholder="Choose customer"
                                                    onValueChange={(value) =>
                                                        router.post(route('admin.bookings.customer', b.id), { customer_id: value })
                                                    }
                                                >
                                                    {customers.map((c) => (
                                                        <BillingSelectItem value={c.id} key={c.id}>
                                                            {c.display_name}
                                                        </BillingSelectItem>
                                                    ))}
                                                </BillingSelect>
                                            ) : (
                                                (b.billing_customer_id ?? 'Not associated')
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </PageContainer>
        </AppLayout>
    );
}
