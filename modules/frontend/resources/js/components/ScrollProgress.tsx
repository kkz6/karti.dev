import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Hairline reading-progress bar pinned to the top of the viewport.
 * Springed so it eases rather than tracking the scroll position rigidly.
 */
export function ScrollProgress() {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 140,
        damping: 26,
        restDelta: 0.001,
    })

    return (
        <motion.div
            aria-hidden="true"
            style={{ scaleX }}
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-primary/40 via-primary to-primary/40"
        />
    )
}
