import { clsx } from 'clsx'

export default function DynamicIcon({ icon, resolver, context, className = '' }) {
    const IconComponent = icon && resolver ? resolver(icon, context) : null

    if (icon && !IconComponent) {
        console.warn(`Icon '${icon}' could not be resolved.`)
    }

    return IconComponent ? <IconComponent className={clsx('it-dynamic-icon', className)} /> : null
}
