import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { FileInput } from 'lucide-react';
import { BillingFeedback } from '../../components/billing-feedback';
export default function Imports({ table }: { table: TableConfig }) {
    const form = useForm<{ file: File | null }>({ file: null });
    return (
        <BillingSettingsWorkspace section="imports">
            <h2 className="text-lg font-semibold">Billing imports</h2>
            <p className="text-muted-foreground text-sm">
                Prepare an explicitly mapped billing JSON export. The dry run validates totals, references, supported currencies and existing mappings
                before any financial record is written. Portal users, passwords and unrelated CRM records are rejected.
            </p>
            <Card>
                <CardHeader>
                    <CardTitle>Validate an import</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post(route('admin.billing.imports.stage'), { forceFormData: true });
                        }}
                    >
                        <Label htmlFor="billing-import-file">Mapped billing JSON (up to 2 MiB)</Label>
                        <Input
                            id="billing-import-file"
                            type="file"
                            accept="application/json,.json"
                            onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                            required
                        />
                        {Object.values(form.errors).length > 0 && (
                            <BillingFeedback kind="error">
                                {Object.values(form.errors).map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </BillingFeedback>
                        )}
                        <Button type="submit" disabled={form.processing || !form.data.file}>
                            Run dry run
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <section className="space-y-4">
                <h2 className="font-semibold">Import history</h2>
                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: 'No imports yet',
                        description: 'Upload a mapped billing file above to validate it before importing.',
                        icons: [FileInput],
                    }}
                />
            </section>
        </BillingSettingsWorkspace>
    );
}
