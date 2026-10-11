import { Head } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { Percent } from 'lucide-react';
import { useState } from 'react';
import { BillingCreateModal } from './billing-create-modal';
import { BillingSettingsWorkspace } from './billing-settings-workspace';

export function CatalogueIndex({ table, canCreate }: { table: TableConfig; canCreate: boolean }) {
    const [creating, setCreating] = useState(false);
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
                    emptyState={{
                        title: `No ${title.toLowerCase()} yet`,
                        description: 'Add an item or adjust your search and filters.',
                        icons: [Percent],
                        action: canCreate ? { label: createLabel, onClick: () => setCreating(true) } : undefined,
                    }}
                />
            </div>
            <BillingCreateModal kind="tax" open={creating} onClose={() => setCreating(false)} />
        </BillingSettingsWorkspace>
    );
}
