import { forwardRef, useImperativeHandle, useRef } from 'react'
import { clsx } from 'clsx'

export default forwardRef(function TextInput({ type = 'text', className = '', value, onChange, ...props }, ref) {
    const inputRef = useRef(null)

    useImperativeHandle(ref, () => ({
        focus: (options = {}) => {
            inputRef.current?.focus(options)
        },
    }))

    return (
        <input
            {...props}
            type={type}
            className={clsx(
                className,
                'it-text-input rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-blue-400 dark:focus:ring-blue-400',
            )}
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
})
