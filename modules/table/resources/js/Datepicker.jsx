import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import './Datepicker.css'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
// Simple dark mode detection
const prefersDarkMode = () => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
};

export default function Datepicker({ value, onChange, range, className = '' }) {
    function selectedFromValue() {
        return range
            ? {
                  from: toDateObject(value?.[0]),
                  to: toDateObject(value?.[1]),
              }
            : toDateObject(value)
    }

    function onSelect(date) {
        onChange(date ? (range ? [formatDate(date.from), formatDate(date.to)] : formatDate(date)) : null)
    }

    function toDateObject(date) {
        if (typeof date === 'string') {
            return new Date(date)
        }

        return date?.getFullYear ? date : null
    }

    function formatDate(date) {
        if (typeof date === 'string') {
            return date
        }

        if (date && !date.getFullYear) {
            return
        }

        return date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : ''
    }

    const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode())

    useEffect(() => {
        const updateDarkMode = () => setIsDarkMode(prefersDarkMode())

        // Listen for changes to the HTML element's class list (which is how the shared appearance system works)
        const observer = new MutationObserver(updateDarkMode)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        })

        return () => observer.disconnect()
    }, [])

    return (
        <div
            data-theme={isDarkMode ? 'dark' : 'light'}
            className={clsx('rounded-md bg-white p-2 shadow-md dark:bg-zinc-900', className)}
        >
            <DayPicker
                mode={range ? 'range' : 'single'}
                selected={selectedFromValue()}
                onSelect={onSelect}
                weekStartsOn={1}
            />
        </div>
    )
}
