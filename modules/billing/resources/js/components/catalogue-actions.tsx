import { Link, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import type { CataloguePermissions } from '../types';
import { useBillingConfirm } from './use-billing-confirm';

export function CatalogueActions({
    id,
    archived,
    can,
    prefix,
}: {
    id: number;
    archived: boolean;
    can: CataloguePermissions;
    prefix: 'admin.services' | 'admin.tax-rates';
}) {
    const { confirm, dialog } = useBillingConfirm();

    const toggle = async () => {
        if (await confirm(archived ? 'Restore this item?' : 'Archive this item? It will no longer be offered for new selections.')) {
            router.post(route(`${prefix}.${archived ? 'restore' : 'archive'}`, id), {}, { preserveScroll: true });
        }
    };
    return (
        <div className="flex gap-2">
            {dialog}
            {can.update && !archived && (
                <Button variant="outline" asChild>
                    <Link href={route(`${prefix}.edit`, id)}>Edit</Link>
                </Button>
            )}
            {(archived ? can.restore : can.archive) && (
                <Button variant="outline" onClick={toggle}>
                    {archived ? 'Restore' : 'Archive'}
                </Button>
            )}
        </div>
    );
}
