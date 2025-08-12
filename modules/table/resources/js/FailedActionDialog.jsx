import ConfirmDialog from './ConfirmDialog'
import { useLang } from '@shared/hooks/use-lang'

export default function FailedActionDialog({ show, onConfirm }) {
    const { t } = useLang();
    return (
        <ConfirmDialog
            show={show}
            title={t('table::table.action_failed_dialog_title')}
            message={t('table::table.action_failed_dialog_message')}
            cancelButton={false}
            confirmButton={t('table::table.action_failed_dialog_button')}
            variant="danger"
            onConfirm={onConfirm}
            onCancel={() => {}} // No-op for failed dialog
        />
    )
}
