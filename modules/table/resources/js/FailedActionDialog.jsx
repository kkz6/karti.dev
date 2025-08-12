import ConfirmDialog from './ConfirmDialog'
import { trans } from './translations'

export default function FailedActionDialog({ show, onConfirm }) {
    return (
        <ConfirmDialog
            show={show}
            title={trans('action_failed_dialog_title')}
            message={trans('action_failed_dialog_message')}
            cancelButton={false}
            confirmButton={trans('action_failed_dialog_button')}
            variant="danger"
            onConfirm={onConfirm}
            onCancel={() => {}} // No-op for failed dialog
        />
    )
}
