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
            {/* Noise grain background overlay using CSS */}
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.4] dark:opacity-[0.2] mix-blend-overlay dark:mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '256px 256px',
                }}
            />

            <div className="fixed inset-0 flex justify-center sm:px-8">
                <div className="flex w-full max-w-7xl lg:px-8">
                    <div className="w-full bg-transparent" />
                </div>
            </div>
            <div className="relative flex min-h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-900">
                <Header />
                <main className="flex-auto">{children}</main>
                <Footer />
            </div>
        </>
    )
}