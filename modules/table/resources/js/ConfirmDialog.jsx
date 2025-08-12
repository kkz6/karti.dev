import React, { useMemo } from 'react'
import { Transition, TransitionChild } from '@headlessui/react'
import { Button } from '@shared/components/ui/button'
import DynamicIcon from './DynamicIcon'
import { clsx } from 'clsx'

const Backdrop = () => (
    <TransitionChild
        as={React.Fragment}
        enter="duration-300 ease-out"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="duration-200 ease-in"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
    >
        <div className="it-confirm-dialog-backdrop fixed inset-0 bg-black/50 dark:bg-zinc-950/60"></div>
    </TransitionChild>
)

const DialogContent = ({ children }) => (
    <TransitionChild
        as={React.Fragment}
        enter="duration-300 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-200 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
    >
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg ring-1 ring-zinc-950/10 transition-all dark:bg-zinc-900 dark:ring-white/10">
            {children}
        </div>
    </TransitionChild>
)

export default function ConfirmDialog({
    title,
    message,
    confirmButton,
    cancelButton = false,
    show,
    danger = false,
    variant = null,
    customVariantClass = '',
    onCancel,
    onConfirm = null,
    icon = null,
    iconResolver,
}) {
    if (!variant) {
        variant = danger ? 'danger' : 'info'
    }

    const iconElement = useMemo(() => {
        if (!icon) {
            return null
        }

        return (
            <div className="it-confirm-dialog-icon-wrapper mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                <DynamicIcon
                    className="size-6 text-gray-500 dark:text-gray-400"
                    resolver={iconResolver}
                    icon={icon}
                />
            </div>
        )
    }, [icon, iconResolver])

    return (
        <Transition
            show={show}
            as={React.Fragment}
        >
            <div className="it-confirm-dialog relative z-30">
                <Backdrop />
                <div className="it-confirm-dialog-content fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <DialogContent>
                            <div className="px-6 pt-6">
                                {iconElement}
                                <h3 className="text-center text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
                                <p className="mt-2 text-center text-gray-600 dark:text-gray-400">{message}</p>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 p-6 dark:border-zinc-700">
                                {cancelButton !== false ? (
                                    <Button
                                        variant="outline"
                                        className="justify-center"
                                        onClick={onCancel}
                                    >
                                        {cancelButton}
                                    </Button>
                                ) : null}
                                <Button
                                    className={clsx('justify-center', cancelButton === false ? 'col-span-2' : 'col-span-1')}
                                    variant={variant === 'danger' ? 'destructive' : 'default'}
                                    onClick={onConfirm}
                                >
                                    {confirmButton}
                                </Button>
                            </div>
                        </DialogContent>
                    </div>
                </div>
            </div>
        </Transition>
    )
}
