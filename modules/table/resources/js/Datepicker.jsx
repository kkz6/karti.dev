import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import './Datepicker.css'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
import { prefersDarkMode } from './uiHelpers'

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

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode())

    useEffect(() => {
        const updateDarkMode = () => setIsDarkMode(prefersDarkMode())
        darkModeMediaQuery.addEventListener('change', updateDarkMode)

        return () => {
            darkModeMediaQuery.removeEventListener('change', updateDarkMode)
        }
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
