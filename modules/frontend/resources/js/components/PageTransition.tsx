import { usePage } from '@inertiajs/react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Fades and lifts the page body on each Inertia navigation. Keyed on the URL so
 * a route change remounts the subtree and replays the animation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
    const { url } = usePage()
    const reduceMotion = useReducedMotion()

    if (reduceMotion) {
        return <>{children}</>
    }

    return (
        <motion.div
            key={url}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    )
}
