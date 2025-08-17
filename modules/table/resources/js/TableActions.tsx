import { useLang } from '@shared/hooks/use-lang';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import ConfirmActionDialog from './ConfirmActionDialog';
import ConfirmDialog from './ConfirmDialog';
import FailedActionDialog from './FailedActionDialog';
import type { ActionsProps, ActionSuccessResult, CustomActionResult, ExportSuccessResult, TableAction, TableExport } from './types/actions';
import { visitUrl } from './urlHelpers';

interface AsyncExportContext {
    dialogTitle?: string;
    dialogMessage?: string;
    targetUrl?: string;
}

interface ConfirmContext {
    action: TableAction;
}

export default function Actions({
    actions,
    keys,
    performAction,
    performAsyncExport = null,
    item,
    iconResolver,
    onSuccess = null,
    onError = null,
    onHandle = null,
    children,
}: ActionsProps) {
    const { t } = useLang();
    const [asyncExportDialogIsOpen, setAsyncExportDialogIsOpen] = useState<boolean>(false);
    const [asyncExportContext, setAsyncExportContext] = useState<AsyncExportContext | null>(null);

    const [confirmDialogIsOpen, setConfirmDialogIsOpen] = useState<boolean>(false);
    const [confirmContext, setConfirmContext] = useState<ConfirmContext | null>(null);

    const handle = (action: TableAction): void => {
        // Check if confirmation is actually needed (has confirmation content)
        const needsConfirmation = action.confirmationRequired && 
            (action.confirmationTitle || action.confirmationMessage);
        
        if (!needsConfirmation) {
            return perform(action);
        }

        setConfirmDialogIsOpen(true);
        setConfirmContext({ action });
    };

    function asyncExport(tableExport: TableExport): void {
        if (!performAsyncExport) {
            return;
        }

        performAsyncExport(tableExport)
            .then(({ response }: ExportSuccessResult) => {
                if (response.data.targetUrl) {
                    return;
                }

                setAsyncExportDialogIsOpen(!!(response.data.dialogTitle || response.data.dialogMessage));
                setAsyncExportContext(response.data);
            })
            .catch(() => {
                setActionFailed(true);
            });
    }

    const [actionFailed, setActionFailed] = useState<boolean>(false);

    const perform = (action: TableAction): void => {
        if (action.isLink) {
            const actionKey = actions.findIndex((a) => a === action);
            const actionData = item?._actions?.[actionKey];

            // Extract the URL string from the action data
            let url: string | null = null;
            if (typeof actionData === 'string') {
                url = actionData;
            } else if (actionData && typeof actionData === 'object' && actionData.url) {
                url = actionData.url;
            }

            // For modal URLs, we'll treat them as regular navigation for now
            // In the future, this could open a shadcn dialog instead
            if (url) {
                visitUrl(url);
            }
            return;
        }

        // Close any open dialogs
        setConfirmDialogIsOpen(false);
        setAsyncExportDialogIsOpen(false);

        const performPromise = performAction(action, keys);

        if (action.isCustom) {
            performPromise.then((result) => {
                if ('onFinish' in result) {
                    const customResult = result as CustomActionResult;
                    onHandle?.(action, customResult.keys, customResult.onFinish);
                }
            });
        } else {
            performPromise
                .then((result) => {
                    if ('response' in result) {
                        const successResult = result as ActionSuccessResult;
                        onSuccess?.(action, successResult.keys);
                    }
                })
                .catch((errorData) => {
                    // Make sure we have the expected error structure
                    if (errorData && typeof errorData === 'object' && 'keys' in errorData) {
                        const { keys, error } = errorData as { keys: (string | number)[]; error: any };
                        onError ? onError(action, keys, error) : setActionFailed(true);
                    } else {
                        // If error structure is unexpected, still handle it
                        console.error('Unexpected error structure in table action:', errorData);
                        onError ? onError(action, keys, errorData) : setActionFailed(true);
                    }
                });
        }
    };

    return (
        <>
            {children({ handle, asyncExport })}

            <ConfirmActionDialog
                show={confirmDialogIsOpen}
                action={confirmContext?.action as any}
                iconResolver={iconResolver}
                onCancel={() => setConfirmDialogIsOpen(false)}
                onConfirm={() => confirmContext && perform(confirmContext.action)}
            />

            <FailedActionDialog show={actionFailed} onConfirm={() => setActionFailed(false)} />

            <ConfirmDialog
                show={asyncExportDialogIsOpen && !!(asyncExportContext?.dialogTitle || asyncExportContext?.dialogMessage)}
                title={asyncExportContext?.dialogTitle ?? ''}
                message={asyncExportContext?.dialogMessage ?? ''}
                icon={'MoreHorizontal' as any}
                iconResolver={() => MoreHorizontal}
                confirmButton={t('table::table.export_processing_dialog_button')}
                onConfirm={(() => setAsyncExportDialogIsOpen(false)) as any}
                onCancel={() => setAsyncExportDialogIsOpen(false)}
            />
        </>
    );
}
