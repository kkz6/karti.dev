import { useEffect, useState, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Initialize from DOM to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  // Sync state with DOM on mount and when class changes
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    }

    updateTheme()

    // Watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateTheme()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'

    // Update DOM immediately
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Save to localStorage
    localStorage.setItem('theme', newTheme)

    // Update state
    setTheme(newTheme)
  }, [theme])

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="group flex items-center justify-center gap-2 h-10 px-3 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
      onClick={toggleTheme}
    >
      <Sun className="h-4 w-4 stroke-current dark:hidden" />
      <Moon className="hidden h-4 w-4 stroke-current dark:block" />
      <span className="hidden sm:inline">{theme === 'dark' ? 'light' : 'dark'}</span>
    </button>
  )
}