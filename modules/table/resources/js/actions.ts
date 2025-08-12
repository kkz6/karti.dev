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

export const useActions = (): UseActionsReturn => {
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

            Axios.post(action.url, { keys: actionKeys, json: true })
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

    return {
        allItemsAreSelected,
        isPerformingAction,
        performAction,
        performAsyncExport,
        selectedItems,
        toggleItem,
    };
};
