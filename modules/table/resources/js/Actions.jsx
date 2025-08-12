import { useState } from 'react'
import ConfirmActionDialog from './ConfirmActionDialog'
import FailedActionDialog from './FailedActionDialog'
import { visitUrl, visitModal } from './urlHelpers'
import { useModalStack } from '@inertiaui/modal-react'
import ConfirmDialog from './ConfirmDialog'
import { trans } from './translations.js'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'

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

    let modalStack = null

    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        modalStack = useModalStack()
    } catch (e) {
        // Ignore
    }

    const perform = (action) => {
        if (action.isLink) {
            const actionKey = actions.findIndex((a) => a === action)
            const url = item._actions[actionKey]

            url.modal ? visitModal(url, modalStack.visitModal) : visitUrl(url)
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
                icon="EllipsisHorizontalIcon"
                iconResolver={() => EllipsisHorizontalIcon}
                confirmButton={trans('export_processing_dialog_button')}
                onConfirm={() => setAsyncExportDialogIsOpen(false)}
            />
        </>
    )
}
