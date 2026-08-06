import { useCallback } from 'react'

/**
 * Feeds cursor position into the --mx/--my custom properties consumed by
 * the `.spotlight` class, so the card border lights up under the pointer.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
    const onPointerMove = useCallback((event: React.PointerEvent<T>) => {
        const target = event.currentTarget
        const rect = target.getBoundingClientRect()

        target.style.setProperty('--mx', `${event.clientX - rect.left}px`)
        target.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }, [])

    return { onPointerMove }
}
