import { Button } from '@shared/components/ui/button';
import { ConfirmationModal } from '@shared/components/ui/confirmation-modal';
import { useClickOutside } from '@shared/hooks/useClickOutside';
import { ChevronDown, Copy, Save } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface SaveDropdownProps {
    onSave: () => void;
    onSaveAsCopy: () => void;
    isSaving?: boolean;
    hasChanges?: boolean;
}

export const SaveDropdown: React.FC<SaveDropdownProps> = ({ onSave, onSaveAsCopy, isSaving = false, hasChanges = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showSaveCopyModal, setShowSaveCopyModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    const handleSaveClick = () => {
        setIsOpen(false);
        if (hasChanges) {
            setShowSaveModal(true);
        } else {
            onSave();
        }
    };

    const handleSaveAsCopyClick = () => {
        setIsOpen(false);
        setShowSaveCopyModal(true);
    };

    const handleConfirmSave = () => {
        onSave();
        setShowSaveModal(false);
    };

    const handleConfirmSaveAsCopy = () => {
        onSaveAsCopy();
        setShowSaveCopyModal(false);
    };

    return (
        <>
            <div ref={dropdownRef} className="relative inline-flex">
                <div className="divide-primary-foreground/30 inline-flex -space-x-px divide-x rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
                    <Button
                        onClick={handleSaveClick}
                        disabled={isSaving || !hasChanges}
                        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                    >
                        <Save className="me-2 h-4 w-4 opacity-60" strokeWidth={2} aria-hidden="true" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={isSaving}
                        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                        size="icon"
                        aria-label="More save options"
                    >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} aria-hidden="true" />
                    </Button>
                </div>

                {isOpen && (
                    <div className="ring-opacity-5 absolute right-0 bottom-full z-50 mb-2 w-48 origin-bottom-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                        <button
                            onClick={handleSaveClick}
                            disabled={!hasChanges}
                            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <Save className="me-2 h-4 w-4" />
                            Save
                        </button>
                        <button
                            onClick={handleSaveAsCopyClick}
                            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <Copy className="me-2 h-4 w-4" />
                            Save as Copy
                        </button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onConfirm={handleConfirmSave}
                title="Save Changes"
                description="This will overwrite the original image. Are you sure you want to continue?"
                confirmText="Save"
                cancelText="Cancel"
                isLoading={isSaving}
            />

            <ConfirmationModal
                isOpen={showSaveCopyModal}
                onClose={() => setShowSaveCopyModal(false)}
                onConfirm={handleConfirmSaveAsCopy}
                title="Save as Copy"
                description="This will create a new copy of the image with your changes. The original image will remain unchanged."
                confirmText="Save Copy"
                cancelText="Cancel"
                isLoading={isSaving}
            />
        </>
    );
};
