import * as LucideIcons from 'lucide-react';

// Icon resolver that works with Lucide icons
let customIconResolver = null;

export const setIconResolver = (resolver) => {
    customIconResolver = resolver;
};

export const resolveIcon = (iconName) => {
    // If custom resolver is set, use it first
    if (customIconResolver) {
        const customIcon = customIconResolver(iconName);
        if (customIcon) return customIcon;
    }

    // Default: resolve from Lucide icons
    if (typeof iconName === 'string') {
        // Convert common icon names to PascalCase for Lucide
        const pascalCaseName = iconName
            .split(/[-_\s]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');

        // Try to find the icon in Lucide
        const LucideIcon = LucideIcons[pascalCaseName] || LucideIcons[iconName];

        if (LucideIcon) {
            return LucideIcon;
        }
    }

    // If icon is already a component, return it
    if (typeof iconName === 'function' || (iconName && typeof iconName === 'object')) {
        return iconName;
    }

    // Fallback to a default icon or the icon name
    return LucideIcons.Circle || iconName;
};
