import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setResolvedTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setResolvedTheme(newTheme)
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="group flex items-center gap-2 px-3 py-1.5 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
      onClick={toggleTheme}
    >
      <Sun className="h-4 w-4 stroke-current dark:hidden" />
      <Moon className="hidden h-4 w-4 stroke-current dark:block" />
      <span className="hidden sm:inline">{resolvedTheme === 'dark' ? 'light' : 'dark'}</span>
    </button>
  )
}