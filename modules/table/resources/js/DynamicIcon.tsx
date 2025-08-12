import { clsx } from 'clsx';
import React from 'react';
import type { DynamicIconProps } from './types';

export default function DynamicIcon({ icon, resolver, context, className = '' }: DynamicIconProps): React.ReactElement | null {
    const IconComponent = icon && resolver ? (resolver as any)(icon, context) : null;

    if (icon && !IconComponent) {
        console.warn(`Icon '${icon}' could not be resolved.`);
    }

    return IconComponent ? <IconComponent className={clsx('it-dynamic-icon', className)} /> : null;
}
