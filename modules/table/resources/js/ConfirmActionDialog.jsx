import ConfirmDialog from './ConfirmDialog'

export default function ConfirmActionDialog({ show, action = {}, onConfirm, onCancel, iconResolver }) {
    const { confirmationTitle = '', confirmationMessage = '', confirmationCancelButton = '', confirmationConfirmButton = '', icon } = action

    return (
        <ConfirmDialog
            show={show}
            title={confirmationTitle}
            message={confirmationMessage}
            cancelButton={confirmationCancelButton}
            confirmButton={confirmationConfirmButton}
            variant={action.variant}
            customVariantClass={action.buttonClass}
            icon={icon}
            iconResolver={iconResolver}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    )
}
