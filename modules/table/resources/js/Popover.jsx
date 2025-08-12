import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Popover as HeadlessPopover, PopoverButton, PopoverPanel } from '@headlessui/react'

export default forwardRef(function Popover({ placement = 'bottom start', children, onOpened = null, onClosed = null, offset = 8, ...props }, ref) {
    const buttonRef = useRef(null)

    useImperativeHandle(ref, () => ({
        clickTrigger: () => {
            requestAnimationFrame(() => buttonRef.current?.click())
        },
    }))

    useEffect(() => {
        const observer = new MutationObserver((records) => {
            const record = records.find((attribute) => attribute.attributeName === 'data-headlessui-state')

            if (record) {
                record.target.getAttribute('data-headlessui-state').includes('open') ? onOpened?.() : onClosed?.()
            }
        })

        if (buttonRef.current?.parentElement) {
            observer.observe(buttonRef.current.parentElement, { attributes: true })
        }

        return () => {
            observer.disconnect()
        }
    }, [onOpened, onClosed])

    return (
        <HeadlessPopover
            className="it-popover"
            {...props}
        >
            <PopoverButton as="div">
                <div ref={buttonRef}>{children.trigger()}</div>
            </PopoverButton>
            <PopoverPanel
                anchor={{
                    to: placement,
                    offset,
                }}
                portal={true}
                unmount={false}
                transition
                className="it-popover-panel w-max min-w-24 !overflow-visible rounded-md bg-white p-1 shadow-lg ring-1 ring-black/5 transition duration-200 ease-out [--anchor-gap:8px] data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-zinc-800/50 dark:ring-zinc-700"
            >
                {children.content()}
            </PopoverPanel>
        </HeadlessPopover>
    )
})
