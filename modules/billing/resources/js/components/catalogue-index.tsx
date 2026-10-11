import { Head } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { BriefcaseBusiness, Percent } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { BillingCreateModal } from './billing-create-modal';
import { BillingSettingsWorkspace } from './billing-settings-workspace';

export function CatalogueIndex({ table, canCreate, kind }: { table: TableConfig; canCreate: boolean; kind: 'services' | 'tax-rates' }) {
    const [creating, setCreating] = useState(false);
    const services = kind === 'services';
    const title = services ? 'Services' : 'Tax presets';
    const createLabel = services ? 'Add service' : 'Add tax preset';
    const Icon = services ? BriefcaseBusiness : Percent;
    const Canvas = services ? AdminPageContent : 'div';
    return (
        <CatalogueLayout services={services} title={title} kind={kind}>
            <Head title={title} />
            <Canvas className="flex min-w-0 flex-col gap-6">
                <IndexHeader
                    title={title}
                    icon={Icon}
                    actions={canCreate ? <Button onClick={() => setCreating(true)}>{createLabel}</Button> : undefined}
                    description={
                        <>
                            {services
                                ? 'Save reusable service descriptions, units, prices and tax defaults. Each price has its own currency.'
                                : 'Define named percentage rates to select when pricing services. Archive rates you no longer use.'}
                        </>
                    }
                />
                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: `No ${title.toLowerCase()} yet`,
                        description: 'Add an item or adjust your search and filters.',
                        icons: [Icon],
                        action: canCreate ? { label: createLabel, onClick: () => setCreating(true) } : undefined,
                    }}
                />
            </Canvas>
            <BillingCreateModal kind={services ? 'service' : 'tax'} open={creating} onClose={() => setCreating(false)} />
        </CatalogueLayout>
    );
}

function CatalogueLayout({ services, title, kind, children }: { services: boolean; title: string; kind: string; children: ReactNode }) {
    return services ? (
        <AppLayout breadcrumbs={[{ title, href: route(`admin.${kind}.index`) }]}>{children}</AppLayout>
    ) : (
        <BillingSettingsWorkspace section="taxes">{children}</BillingSettingsWorkspace>
    );
}
