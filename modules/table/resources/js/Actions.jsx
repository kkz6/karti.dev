import { useState } from 'react'
import ConfirmActionDialog from './ConfirmActionDialog'
import FailedActionDialog from './FailedActionDialog'
import { visitUrl, visitModal } from './urlHelpers'
import ConfirmDialog from './ConfirmDialog'
import { useLang } from '@shared/hooks/use-lang'
import { MoreHorizontal } from 'lucide-react';

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
}) {
    const { t } = useLang();
    const [asyncExportDialogIsOpen, setAsyncExportDialogIsOpen] = useState(false)
    const [asyncExportContext, setAsyncExportContext] = useState(null)

    const [confirmDialogIsOpen, setConfirmDialogIsOpen] = useState(false)
    const [confirmContext, setConfirmContext] = useState(null)

    const handle = (action) => {
        if (!action.confirmationRequired) {
            return perform(action)
        }

        setConfirmDialogIsOpen(true)
        setConfirmContext({ action })
    }

    function asyncExport(tableExport) {
        performAsyncExport(tableExport)
            .then(({ response }) => {
                if (response.data.targetUrl) {
                    return
                }

                setAsyncExportDialogIsOpen(!!(response.data.dialogTitle || response.data.dialogMessage))
                setAsyncExportContext(response.data)
            })
            .catch(() => {
                setActionFailed(true)
            })
    }

    const [actionFailed, setActionFailed] = useState(false)

    const perform = (action) => {
        if (action.isLink) {
            const actionKey = actions.findIndex((a) => a === action)
            const url = item._actions[actionKey]

            // For modal URLs, we'll treat them as regular navigation for now
            // In the future, this could open a shadcn dialog instead
            visitUrl(url)
            return
        }

        setConfirmDialogIsOpen(false)

        const performPromise = performAction(action, keys)

        action.isCustom
            ? performPromise.then(({ keys, onFinish }) => onHandle?.(action, keys, onFinish))
            : performPromise
                  .then(({ keys }) => onSuccess?.(action, keys))
                  .catch(({ keys, error }) => {
                      onError ? onError(action, keys, error) : setActionFailed(true)
                  })
    }

    return (
        <>
            {children({ handle, asyncExport })}

            <ConfirmActionDialog
                show={confirmDialogIsOpen}
                action={confirmContext?.action}
                iconResolver={iconResolver}
                onCancel={() => setConfirmDialogIsOpen(false)}
                onConfirm={() => perform(confirmContext.action)}
            />

            <FailedActionDialog
                show={actionFailed}
                onConfirm={() => setActionFailed(false)}
            />

            <ConfirmDialog
                show={asyncExportDialogIsOpen}
                title={asyncExportContext?.dialogTitle ?? ''}
                message={asyncExportContext?.dialogMessage ?? ''}
                icon="MoreHorizontal"
                iconResolver={() => MoreHorizontal}
                confirmButton={t('table::table.export_processing_dialog_button')}
                onConfirm={() => setAsyncExportDialogIsOpen(false)}
            />
        </>
    )
}
