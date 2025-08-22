import React from 'react';
import { Modal } from './modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'default',
    isLoading = false,
}) => {
    const handleConfirm = () => {
        onConfirm();
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Modal.Modal active={isOpen} onClickOutside={onClose}>
            <Modal.Body>
                <Modal.Header>
                    <Modal.Title>{title}</Modal.Title>
                    {description && <Modal.Subtitle>{description}</Modal.Subtitle>}
                </Modal.Header>
            </Modal.Body>

            <Modal.Actions>
                <Modal.Action onClick={onClose} variant="outline" disabled={isLoading}>
                    {cancelText}
                </Modal.Action>

                <Modal.Action onClick={handleConfirm} variant={confirmVariant} disabled={isLoading}>
                    {isLoading ? 'Processing...' : confirmText}
                </Modal.Action>
            </Modal.Actions>
        </Modal.Modal>
    );
};
