import { Head, Link, router } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { EmptyState } from '@shared/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { CreditCard, ListChecks, Radio, SlidersHorizontal } from 'lucide-react';
import { BillingFeedback } from '../components/billing-feedback';
export default function Reconciliation({
    checkoutsTable,
    eventsTable,
    onlineEnabled,
    canViewSettings,
    message,
}: {
    checkoutsTable: TableConfig;
    eventsTable: TableConfig;
    onlineEnabled: boolean;
    canViewSettings: boolean;
    message?: string;
}) {
    const settingsUrl = route('admin.settings.billing.edit', { section: 'online' });
    const hasActivity = [checkoutsTable, eventsTable].some(
        (table) =>
            table.hasRecords === true ||
            (table.results?.total ?? 0) > 0 ||
            !!table.state.search ||
            Object.values(table.state.filters).some((filter) => filter.enabled),
    );
    return (
        <AppLayout breadcrumbs={[{ title: 'Payment reconciliation', href: route('admin.billing.reconciliation') }]}>
            <Head title="Payment reconciliation" />
            <AdminPageContent>
                <IndexHeader
                    title="Payment reconciliation"
                    icon={ListChecks}
                    actions={
                        canViewSettings ? (
                            <Button variant="outline" asChild>
                                <Link href={settingsUrl}>
                                    <SlidersHorizontal />
                                    Payment settings
                                </Link>
                            </Button>
                        ) : undefined
                    }
                    description={<> Match online charges to invoice balances and resolve payments that need attention. </>}
                />
                {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
                {!hasActivity ? (
                    <section className="rounded-lg border p-5 sm:p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-muted grid size-10 shrink-0 place-items-center rounded-lg">
                                <CreditCard className="text-muted-foreground size-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <h2 className="text-base font-semibold">
                                    {onlineEnabled ? 'No online payment activity yet' : 'Set up online invoice payments'}
                                </h2>
                                <p className="text-muted-foreground max-w-xl text-sm leading-6">
                                    {onlineEnabled
                                        ? 'Customer checkouts and verified provider events will appear here once an invoice is paid online.'
                                        : 'Connect your payment provider to accept invoice payments online. You can already record manual payments from an invoice.'}
                                </p>
                                {canViewSettings && (
                                    <Button variant="outline" className="mt-2" asChild>
                                        <Link href={settingsUrl}>{onlineEnabled ? 'View payment settings' : 'Configure online payments'}</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </section>
                ) : (
                    <Tabs defaultValue="checkouts" className="space-y-5">
                        <TabsList className="w-full justify-start sm:w-auto">
                            <TabsTrigger value="checkouts" className="flex-1 gap-2">
                                <CreditCard className="size-4" />
                                Checkouts
                            </TabsTrigger>
                            <TabsTrigger value="events" className="flex-1 gap-2">
                                <Radio className="size-4" />
                                Payment events
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="checkouts">
                            <div className="mb-4">
                                <h2 className="font-semibold">Online checkout attempts</h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    The amount quoted at checkout and the result of payment verification.
                                </p>
                            </div>
                            {checkoutsTable.results?.total === 0 &&
                            !checkoutsTable.state.search &&
                            !Object.values(checkoutsTable.state.filters).some((f) => f.enabled) ? (
                                <div className="min-w-0">
                                    <EmptyState
                                        title="No online checkouts yet"
                                        description="Checkout attempts appear here when a customer chooses to pay an invoice online."
                                        icons={[CreditCard]}
                                        action={
                                            canViewSettings
                                                ? { label: 'Configure online payments', onClick: () => router.visit(settingsUrl) }
                                                : undefined
                                        }
                                        className="py-8"
                                    />
                                </div>
                            ) : (
                                <InertiaTableWrapper resource={checkoutsTable} />
                            )}
                        </TabsContent>
                        <TabsContent value="events">
                            <div className="mb-4">
                                <h2 className="font-semibold">Verified payment events</h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Provider notifications are verified before payments are applied. Failed or pending events can be retried.
                                </p>
                            </div>
                            {eventsTable.results?.total === 0 &&
                            !eventsTable.state.search &&
                            !Object.values(eventsTable.state.filters).some((f) => f.enabled) ? (
                                <div className="min-w-0">
                                    <EmptyState
                                        title="No payment events yet"
                                        description="Verified notifications from your payment provider will appear here."
                                        icons={[Radio]}
                                        className="py-8"
                                    />
                                </div>
                            ) : (
                                <InertiaTableWrapper resource={eventsTable} />
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </AdminPageContent>
        </AppLayout>
    );
}
