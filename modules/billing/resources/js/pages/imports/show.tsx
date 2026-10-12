import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Label } from '@shared/components/ui/label';
import { BillingFeedback } from '../../components/billing-feedback';
export default function ImportReview({
    batch,
    report,
    reviewToken,
    hasSourceArchive,
}: {
    batch: { id: number; source: string; state: string };
    report: {
        errors: { path: string; message: string }[];
        warnings: string[];
        counts: Record<string, { new: number; existing: number }>;
        mapping: Record<string, string>;
    };
    reviewToken: string;
    message?: string;
    hasSourceArchive?: boolean;
}) {
    const form = useForm({ review_token: reviewToken, confirmed: false });
    return (
        <BillingSettingsWorkspace section="imports">
            <h2 className="text-lg font-semibold">Import review - {batch.source}</h2>
            {hasSourceArchive && (
                <Button variant="outline" size="sm" asChild>
                    <a href={route('admin.billing.imports.archive', batch.id)}>Download imported source records</a>
                </Button>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Object.entries(report.counts).map(([kind, count]) => (
                        <p key={kind}>
                            {kind}: {count.new} new, {count.existing} already mapped
                        </p>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Declared mapping</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="space-y-2">
                        {Object.entries(report.mapping).map(([key, value]) => (
                            <div key={key} className="text-sm">
                                <dt className="font-medium">{key}</dt>
                                <dd className="break-all">{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
                            </div>
                        ))}
                    </dl>
                </CardContent>
            </Card>
            {report.errors.map((error, i) => (
                <BillingFeedback key={i} kind="error">
                    <strong>{error.path}</strong>
                    <p className="break-words">{error.message}</p>
                </BillingFeedback>
            ))}
            {report.warnings.map((warning, i) => (
                <BillingFeedback key={i}>{warning}</BillingFeedback>
            ))}
            {Object.values(form.errors).length > 0 && (
                <BillingFeedback kind="error">
                    {Object.values(form.errors).map((error, i) => (
                        <p key={i}>{error}</p>
                    ))}
                </BillingFeedback>
            )}
            {batch.state !== 'imported' && (
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('admin.billing.imports.commit', batch.id));
                    }}
                >
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="confirm-billing-import"
                            checked={form.data.confirmed}
                            onCheckedChange={(v) => form.setData('confirmed', v === true)}
                        />
                        <Label htmlFor="confirm-billing-import">
                            I reviewed the source inventory and mapping, reconciled unsupported credit/adjustment history, and approve importing into
                            this billing database
                        </Label>
                    </div>
                    <Button type="submit" disabled={form.processing || !form.data.confirmed || report.errors.length > 0}>
                        Import reviewed records
                    </Button>
                </form>
            )}
            {batch.state === 'imported' && (
                <BillingFeedback kind="info">This batch was imported. Replaying it does not create duplicate financial records.</BillingFeedback>
            )}
        </BillingSettingsWorkspace>
    );
}
