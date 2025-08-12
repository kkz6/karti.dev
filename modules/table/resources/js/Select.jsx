import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { clsx } from 'clsx'

export default forwardRef(function Select({ children, className = '', multiple = false, value, onChange, ...props }, ref) {
    const selectRef = useRef(null)

    useImperativeHandle(ref, () => ({
        focus: (options = {}) => {
            selectRef.current?.focus(options)
        },
    }))

    const handleChange = (e) => {
        if (multiple) {
            const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value)
            onChange(selectedValues)
        } else {
            onChange(e.target.value)
        }
    }

    useEffect(() => {
        if (!multiple && (value === '' || value === null || value === undefined)) {
            // Select the first option if the value is empty
            onChange(selectRef.current?.options?.[0]?.value)
        }
    }, [value, multiple])

    return (
        <select
            ref={selectRef}
            className={clsx(
                className,
                'it-select-input rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-blue-400 dark:focus:ring-blue-400',
            )}
            multiple={multiple}
            value={value ?? (multiple ? [] : '')}
            onChange={handleChange}
            {...props}
        >
            {children}
        </select>
    )
})
