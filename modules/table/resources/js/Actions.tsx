import { useState } from 'react';
// @ts-ignore - shared module types not available
import { useLang } from '@shared/hooks/use-lang';
import { MoreHorizontal } from 'lucide-react';
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
        if (!action.confirmationRequired) {
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
            const url = item?._actions?.[actionKey];

            // For modal URLs, we'll treat them as regular navigation for now
            // In the future, this could open a shadcn dialog instead
            if (url) {
                visitUrl(url);
            }
            return;
        }

        setConfirmDialogIsOpen(false);

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
                .catch(({ keys, error }: { keys: (string | number)[]; error: any }) => {
                    onError ? onError(action, keys, error) : setActionFailed(true);
                });
        }
    };

    return (
        <>
            {children({ handle, asyncExport })}

            <ConfirmActionDialog
                show={confirmDialogIsOpen}
                action={confirmContext?.action}
                iconResolver={iconResolver}
                onCancel={() => setConfirmDialogIsOpen(false)}
                onConfirm={() => confirmContext && perform(confirmContext.action)}
            />

            <FailedActionDialog show={actionFailed} onConfirm={() => setActionFailed(false)} />

            <ConfirmDialog
                show={asyncExportDialogIsOpen}
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
