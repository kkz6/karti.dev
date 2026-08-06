import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Wraps a group whose children should cascade in as it enters the viewport.
 * Pair with <Reveal.Item>. Respects prefers-reduced-motion.
 */
export function Reveal({
    children,
    className,
    delay = 0,
    stagger = 0.08,
}: {
    children: ReactNode
    className?: string
    delay?: number
    stagger?: number
}) {
    const reduceMotion = useReducedMotion()

    const container: Variants = {
        hidden: {},
        visible: {
            transition: reduceMotion
                ? {}
                : { staggerChildren: stagger, delayChildren: delay },
        },
    }

    return (
        <motion.div
            className={className}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
        >
            {children}
        </motion.div>
    )
}

Reveal.Item = function RevealItem({
    children,
    className,
    as = 'div',
}: {
    children: ReactNode
    className?: string
    as?: 'div' | 'li' | 'article' | 'section'
}) {
    const reduceMotion = useReducedMotion()

    const item: Variants = {
        hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: reduceMotion ? 0.2 : 0.6, ease: EASE },
        },
    }

    const Component = motion[as]

    return (
        <Component className={className} variants={item}>
            {children}
        </Component>
    )
}
