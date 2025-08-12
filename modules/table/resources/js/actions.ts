import { router } from '@inertiajs/react';
import { default as Axios } from 'axios';
import { useMemo, useState } from 'react';
import type {
    ActionErrorResult,
    ActionSuccessResult,
    CustomActionResult,
    ExportErrorResult,
    ExportSuccessResult,
    TableAction,
    TableExport,
    UseActionsReturn,
} from './types/actions';

export const useActions = (
    resource?: any,
    tableInstance?: any,
    onActionSuccess?: ((action: any, keys: any[]) => void) | null,
    onActionError?: ((action: any, keys: any[], error: any) => void) | null,
    onCustomAction?: ((action: any, keys: any[], onFinish?: () => void) => void) | null,
): UseActionsReturn => {
    const [isPerformingAction, setIsPerformingAction] = useState<boolean>(false);
    const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);

    const toggleItem = useMemo(
        () => (id: string | number | '*') => {
            setSelectedItems((prevItems) => {
                if (id === '*') {
                    return prevItems.includes('*') ? [] : ['*'];
                }
                if (prevItems.includes(id)) {
                    return prevItems.filter((item) => item !== id);
                } else {
                    return [...prevItems, id];
                }
            });
        },
        [],
    );

    const allItemsAreSelected = useMemo(() => selectedItems.includes('*'), [selectedItems]);

    const makeExportUrl = (tableExport: TableExport): string => {
        if (!tableExport.limitToSelectedRows) {
            return tableExport.url;
        }

        return `${tableExport.url}&keys=${selectedItems.join(',')}`;
    };

    const performAsyncExport = (tableExport: TableExport): Promise<ExportSuccessResult> => {
        return new Promise((resolve, reject) => {
            const keys = selectedItems;

            setIsPerformingAction(true);

            Axios.post(makeExportUrl(tableExport))
                .then((response) => {
                    const result: ExportSuccessResult = { keys, response };
                    resolve(result);

                    if (!response.data?.targetUrl) {
                        return;
                    }

                    return router.visit(response.data.targetUrl, {
                        preserveState: true,
                        preserveScroll: true,
                    });
                })
                .catch((error) => {
                    const errorResult: ExportErrorResult = { keys, error };
                    reject(errorResult);
                })
                .finally(() => {
                    setIsPerformingAction(false);
                    setSelectedItems([]);
                });
        });
    };

    const performAction = (action: TableAction, keys: (string | number)[] | null = null): Promise<ActionSuccessResult | CustomActionResult> => {
        return new Promise((resolve, reject) => {
            if (!action.authorized) {
                reject(new Error('Action not authorized'));
                return;
            }

            const actionKeys = keys ?? selectedItems;

            setIsPerformingAction(true);

            if (action.isCustom) {
                const customResult: CustomActionResult = {
                    keys: actionKeys,
                    onFinish: () => {
                        setIsPerformingAction(false);
                        setSelectedItems([]);
                    },
                };
                resolve(customResult);
                return;
            }

            Axios.post(action.url || '', { keys: actionKeys, json: true })
                .then((response) => {
                    const result: ActionSuccessResult = { keys: actionKeys, response };
                    resolve(result);

                    if (response.data?.targetUrl) {
                        router.visit(response.data.targetUrl, {
                            preserveState: true,
                            preserveScroll: true,
                        });
                    }
                })
                .catch((error) => {
                    const errorResult: ActionErrorResult = { keys: actionKeys, error };
                    reject(errorResult);
                })
                .finally(() => {
                    setIsPerformingAction(false);
                    setSelectedItems([]);
                });
        });
    };

    // Additional selection management functions
    const hasActions = useMemo(() => {
        // Check if there are any bulk actions or exports available
        const actions = resource?.actions || [];
        const exports = resource?.exports || [];
        return actions.some((action: any) => action.asBulkAction) || exports.length > 0;
    }, [resource]);
    const hasSelectedItems = useMemo(() => selectedItems.length > 0, [selectedItems]);
    const isAllSelected = allItemsAreSelected;

    const isSelected = (item: any): boolean => {
        if (allItemsAreSelected) return true;
        const itemId = item.id || item._primary_key;
        return selectedItems.includes(itemId);
    };

    const setSelected = (items: (string | number)[]): void => {
        setSelectedItems(items);
    };

    const selectAll = (checked: boolean): void => {
        if (checked) {
            setSelectedItems(['*']);
        } else {
            setSelectedItems([]);
        }
    };

    const removeSelection = (): void => {
        setSelectedItems([]);
    };

    const toggleSelection = (item: any): void => {
        const itemId = item.id || item._primary_key;
        toggleItem(itemId);
    };

    return {
        allItemsAreSelected,
        hasActions,
        hasSelectedItems,
        isAllSelected,
        isPerformingAction,
        isSelected,
        performAction,
        performAsyncExport,
        removeSelection,
        selectAll,
        selectedItems,
        setSelected,
        toggleItem,
        toggleSelection,
    };
};
