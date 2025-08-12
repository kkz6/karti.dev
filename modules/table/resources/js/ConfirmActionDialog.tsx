import React from 'react';
import ConfirmDialog from './ConfirmDialog';
import type { ConfirmActionDialogProps } from './types';

export default function ConfirmActionDialog({ show, action = {}, onConfirm, onCancel, iconResolver }: ConfirmActionDialogProps): React.ReactElement {
    const {
        confirmationTitle = '',
        confirmationMessage = '',
        confirmationCancelButton = '',
        confirmationConfirmButton = '',
        icon,
        variant,
        buttonClass,
    } = action;

    return (
        <ConfirmDialog
            show={show}
            title={confirmationTitle}
            message={confirmationMessage}
            cancelButton={confirmationCancelButton || 'Cancel'}
            confirmButton={confirmationConfirmButton || 'Confirm'}
            variant={variant || null}
            customVariantClass={buttonClass || ''}
            icon={icon || null}
            iconResolver={iconResolver || null}
            onCancel={onCancel || null}
            onConfirm={onConfirm || null}
        />
    );
}
