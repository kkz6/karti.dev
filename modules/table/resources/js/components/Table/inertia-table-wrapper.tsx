import { EmptyState } from '@shared/components/ui/empty-state';
import { LucideIcon } from 'lucide-react';
import Table from '../../Table.jsx';
import type { Action, FilterState, TableConfig } from '../../types';

interface InertiaTableWrapperProps<T = any> {
    resource: TableConfig<T>;
    emptyState?: {
        title: string;
        description?: string;
        icons?: LucideIcon[];
        action?: {
            label: string;
            onClick: () => void;
            disabled?: boolean;
        };
    };
    onCustomAction?: (action: Action, items: (string | number)[], onFinish?: () => void) => void;
    onActionSuccess?: (action: Action, keys: (string | number)[]) => void;
    onActionError?: (action: Action, keys: (string | number)[], error: unknown) => void;
    onRowClick?: (item: T, column: any) => void;
}

export function InertiaTableWrapper<T = any>({
    resource,
    emptyState,
    onCustomAction,
    onActionSuccess,
    onActionError,
    onRowClick,
}: InertiaTableWrapperProps<T>) {
    // Check if we should show the empty state
    // Show empty state only when:
    // 1. There are no total results
    // 2. There's no active search
    // 3. There are no active filters
    const shouldShowEmptyState =
        resource.results?.total === 0 && !resource.state.search && !Object.values(resource.state.filters).some((f: FilterState) => f.enabled);

    if (shouldShowEmptyState && emptyState) {
        return (
            <div className="flex h-[calc(100vh-250px)] items-center justify-center">
                <EmptyState title={emptyState.title} description={emptyState.description} icons={emptyState.icons} action={emptyState.action} />
            </div>
        );
    }

    return (
        <Table
            resource={resource}
            onCustomAction={onCustomAction as any}
            onActionSuccess={onActionSuccess as any}
            onActionError={onActionError as any}
            onRowClick={onRowClick as any}
        />
    );
}
