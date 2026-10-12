import { Head, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { InertiaTableWrapper, type Action, type TableConfig } from '@table/components';
import { Percent } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { BillingCreateModal } from './billing-create-modal';
import { BillingSettingsWorkspace } from './billing-settings-workspace';
import { useBillingConfirm } from './use-billing-confirm';

export function CatalogueIndex({ table, canCreate, canView }: { table: TableConfig; canCreate: boolean; canView: boolean }) {
    const [creating, setCreating] = useState(false);
    const [selected, setSelected] = useState<{ id: number; readOnly: boolean } | null>(null);
    const { confirm, dialog } = useBillingConfirm();
    const handleAction = async (action: Action, keys: (string | number)[], onFinish?: () => void) => {
        const id = Number(keys[0]);
        if (action.label === 'Edit' || action.label === 'View') {
            onFinish?.();
            setSelected({ id, readOnly: action.label === 'View' });
            return;
        }
        const deleting = action.label === 'Delete';
        if (
            !(await confirm(
                deleting ? 'Delete this tax preset? Used presets cannot be deleted; archive them instead.' : `${action.label} this tax preset?`,
            ))
        ) {
            onFinish?.();
            return;
        }
        const options = { preserveScroll: true, onFinish, onError: (errors: Record<string, string>) => toast.error(Object.values(errors).join(' ')) };
        if (deleting) router.delete(route('admin.tax-rates.destroy', id), options);
        else router.post(route(`admin.tax-rates.${action.label === 'Restore' ? 'restore' : 'archive'}`, id), {}, options);
    };
    const title = 'Tax presets';
    const createLabel = 'Add tax preset';
    return (
        <BillingSettingsWorkspace section="taxes">
            <Head title={title} />
            <div className="flex min-w-0 flex-col gap-6">
                <IndexHeader
                    title={title}
                    icon={Percent}
                    actions={canCreate ? <Button onClick={() => setCreating(true)}>{createLabel}</Button> : undefined}
                    description="Define named percentage rates for invoice items. Archive rates you no longer use."
                />
                <InertiaTableWrapper
                    resource={table}
                    onCustomAction={(action, keys, finish) => void handleAction(action, keys, finish)}
                    onRowClick={canView ? (item) => setSelected({ id: Number(item._primary_key), readOnly: true }) : undefined}
                    emptyState={{
                        title: `No ${title.toLowerCase()} yet`,
                        description: 'Add an item or adjust your search and filters.',
                        icons: [Percent],
                        action: canCreate ? { label: createLabel, onClick: () => setCreating(true) } : undefined,
                    }}
                />
            </div>
            {dialog}
            <BillingCreateModal
                kind="tax"
                open={creating || selected !== null}
                recordId={selected?.id}
                readOnly={selected?.readOnly}
                onClose={() => {
                    setCreating(false);
                    setSelected(null);
                }}
            />
        </BillingSettingsWorkspace>
    );
}
