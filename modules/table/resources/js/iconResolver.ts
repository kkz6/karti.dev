import * as LucideIcons from 'lucide-react';
import type { IconComponent, IconInput, IconResolver } from './types';

// Icon resolver that works with Lucide icons
let customIconResolver: IconResolver | null = null;

export const setIconResolver = (resolver: IconResolver): void => {
    customIconResolver = resolver;
};

export const resolveIcon = (iconName: IconInput, context?: any): IconComponent | null => {
    // If custom resolver is set, use it first
    if (customIconResolver && typeof iconName === 'string') {
        const customIcon = customIconResolver(iconName, context);
        if (customIcon) return customIcon;
    }

    // Default: resolve from Lucide icons
    if (typeof iconName === 'string') {
        // Convert common icon names to PascalCase for Lucide
        const pascalCaseName = iconName
            .split(/[-_\s]/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');

        // Try to find the icon in Lucide
        const LucideIcon = (LucideIcons as any)[pascalCaseName] || (LucideIcons as any)[iconName];

        if (LucideIcon) {
            return LucideIcon as IconComponent;
        }
    }

    // If icon is already a component, return it
    if (typeof iconName === 'function' || (iconName && typeof iconName === 'object')) {
        return iconName as IconComponent;
    }

    // Fallback to a default icon or null
    return LucideIcons.Circle || null;
};
