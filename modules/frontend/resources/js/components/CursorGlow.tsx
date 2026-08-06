import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * A soft light that trails the pointer with a little spring lag, plus a thin
 * ring that widens over interactive elements. Deliberately low-contrast — it
 * should register as atmosphere, not as a custom cursor.
 *
 * Skipped entirely on touch input and when the user prefers reduced motion.
 */
export function CursorGlow() {
    const [enabled, setEnabled] = useState(false)
    const [visible, setVisible] = useState(false)
    const [active, setActive] = useState(false)

    const x = useMotionValue(-200)
    const y = useMotionValue(-200)

    // Ring lags slightly behind the glow, which is what reads as "weight"
    const ringX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.45 })
    const ringY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.45 })
    const glowX = useSpring(x, { stiffness: 90, damping: 20, mass: 0.6 })
    const glowY = useSpring(y, { stiffness: 90, damping: 20, mass: 0.6 })

    useEffect(() => {
        const finePointer = window.matchMedia('(pointer: fine)')
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

        const resolve = () => setEnabled(finePointer.matches && !reduceMotion.matches)

        resolve()
        finePointer.addEventListener('change', resolve)
        reduceMotion.addEventListener('change', resolve)

        return () => {
            finePointer.removeEventListener('change', resolve)
            reduceMotion.removeEventListener('change', resolve)
        }
    }, [])

    useEffect(() => {
        if (!enabled) return

        const INTERACTIVE = 'a, button, input, textarea, select, summary, [role="button"], [tabindex]:not([tabindex="-1"])'

        function handleMove(event: PointerEvent) {
            x.set(event.clientX)
            y.set(event.clientY)
            setVisible(true)
            setActive(Boolean((event.target as Element | null)?.closest?.(INTERACTIVE)))
        }

        function handleLeave() {
            setVisible(false)
        }

        window.addEventListener('pointermove', handleMove, { passive: true })
        document.addEventListener('pointerleave', handleLeave)

        return () => {
            window.removeEventListener('pointermove', handleMove)
            document.removeEventListener('pointerleave', handleLeave)
        }
    }, [enabled, x, y])

    if (!enabled) return null

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[65] hidden md:block">
            <motion.div
                className="absolute rounded-full"
                style={{
                    x: glowX,
                    y: glowY,
                    width: 340,
                    height: 340,
                    marginLeft: -170,
                    marginTop: -170,
                    background: 'radial-gradient(circle, var(--primary) 0%, transparent 62%)',
                }}
                animate={{ opacity: visible ? (active ? 0.09 : 0.055) : 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            <motion.div
                className="absolute rounded-full border border-primary/40"
                style={{
                    x: ringX,
                    y: ringY,
                    width: 26,
                    height: 26,
                    marginLeft: -13,
                    marginTop: -13,
                }}
                animate={{
                    opacity: visible ? (active ? 0.55 : 0.22) : 0,
                    scale: active ? 1.5 : 1,
                }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
            />
        </div>
    )
}
