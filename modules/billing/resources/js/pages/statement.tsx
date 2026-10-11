import { BillingPageContainer as PageContainer } from '@billing/components/billing-page-container';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Label } from '@shared/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import AppLayout from '@shared/layouts/app-layout';
import { BookOpen, Download, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { BillingFeedback } from '../components/billing-feedback';
type StatementData = {
    customer: { id: number; display_name: string };
    from: string;
    to: string;
    groups: {
        currency: string;
        opening: string;
        closing: string;
        charges: string;
        credits: string;
        entries: { date: string; description: string; debit: string; credit: string; balance: string }[];
    }[];
};
export default function Statement({ statement }: { statement: StatementData }) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [from, setFrom] = useState(statement.from),
        [to, setTo] = useState(statement.to);
    const filters = { customer: statement.customer.id, from: statement.from, to: statement.to };
    const hasData = statement.groups.length > 0;
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Customers', href: route('admin.customers.index') },
                { title: statement.customer.display_name, href: route('admin.customers.show', statement.customer.id) },
                { title: 'Statement', href: route('admin.customers.statement', filters) },
            ]}
        >
            <Head title="Account statement" />
            <PageContainer className="space-y-6">
                <div className="space-y-2">
                    <IndexHeader
                        title="Account statement"
                        icon={BookOpen}
                        actions={
                            hasData ? (
                                <>
                                    <Button variant="outline" asChild>
                                        <a href={route('admin.customers.statement', { ...filters, format: 'pdf' })}>
                                            <Download />
                                            Download PDF
                                        </a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href={route('admin.customers.statement', { ...filters, format: 'csv' })}>
                                            <FileSpreadsheet />
                                            Download CSV
                                        </a>
                                    </Button>
                                </>
                            ) : undefined
                        }
                    />
                    <p className="text-muted-foreground text-sm">{statement.customer.display_name}</p>
                </div>
                <form
                    className="flex flex-wrap items-end gap-3 border-b pb-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(route('admin.customers.statement', statement.customer.id), { from, to });
                    }}
                >
                    <div className="w-full space-y-2 sm:w-44">
                        <Label htmlFor="statement-from">From</Label>
                        <DateField id="statement-from" label="Statement from" value={from} onChange={setFrom} />
                    </div>
                    <div className="w-full space-y-2 sm:w-44">
                        <Label htmlFor="statement-to">To</Label>
                        <DateField id="statement-to" label="Statement to" value={to} onChange={setTo} />
                    </div>
                    <Button type="submit" variant="outline">
                        Update statement
                    </Button>
                </form>
                {errors && Object.values(errors).length > 0 && (
                    <BillingFeedback kind="error">
                        {Object.values(errors).map((error, index) => (
                            <p key={index}>{error}</p>
                        ))}
                    </BillingFeedback>
                )}
                {!hasData && (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="bg-muted grid size-12 place-items-center rounded-full">
                            <BookOpen className="text-muted-foreground size-5" />
                        </div>
                        <h2 className="font-semibold">No statement activity yet</h2>
                        <p className="text-muted-foreground max-w-md text-sm">
                            There are no posted billing entries for this customer in the selected period. Draft invoices appear here once they are
                            issued.
                        </p>
                        <Button asChild variant="outline" className="mt-2">
                            <Link href={route('admin.customers.show', statement.customer.id)}>View customer</Link>
                        </Button>
                    </div>
                )}
                {statement.groups.map((group) => (
                    <Card key={group.currency}>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>{group.currency} statement</CardTitle>
                            <p className="text-muted-foreground text-xs">
                                {statement.from} to {statement.to}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {['Date', 'Details', 'Debit', 'Credit', 'Balance'].map((title, index) => (
                                            <TableHead key={title} className={index > 1 ? 'text-right' : undefined}>
                                                {title}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="bg-muted/30">
                                        <TableCell>{statement.from}</TableCell>
                                        <TableCell>Opening balance</TableCell>
                                        <TableCell />
                                        <TableCell />
                                        <TableCell className="text-right font-medium tabular-nums">{group.opening}</TableCell>
                                    </TableRow>
                                    {group.entries.map((entry, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                                            <TableCell className="whitespace-normal">{entry.description}</TableCell>
                                            <TableCell className="text-right tabular-nums">{entry.debit}</TableCell>
                                            <TableCell className="text-right tabular-nums">{entry.credit}</TableCell>
                                            <TableCell className="text-right font-medium tabular-nums">{entry.balance}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-semibold">
                                        <TableCell>{statement.to}</TableCell>
                                        <TableCell>Closing balance</TableCell>
                                        <TableCell className="text-right tabular-nums">{group.charges}</TableCell>
                                        <TableCell className="text-right tabular-nums">{group.credits}</TableCell>
                                        <TableCell className="text-right tabular-nums">{group.closing}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </PageContainer>
        </AppLayout>
    );
}
