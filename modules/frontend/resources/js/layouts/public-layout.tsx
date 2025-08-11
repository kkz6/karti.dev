import { useEffect, type ReactNode } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

interface PublicLayoutProps {
    children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
    useEffect(() => {
        // Check for dark mode preference on mount
        const isDark = localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    return (
        <>
            <div className="fixed inset-0 flex justify-center sm:px-8">
                <div className="flex w-full max-w-7xl lg:px-8">
                    <div className="w-full bg-transparent" />
                </div>
            </div>
            <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-zinc-900">
                <Header />
                <main className="flex-auto">{children}</main>
                <Footer />
            </div>
        </>
    )
}