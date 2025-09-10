import { useCallback } from 'react';
import slug from 'slug';

// Configure the slug package for consistent behavior
slug.defaults.mode = 'rfc3986';
slug.defaults.modes['rfc3986'] = {
    replacement: '-',
    symbols: true,
    remove: /[.]/g,
    lower: true,
    charmap: slug.defaults.charmap,
    multicharmap: slug.defaults.multicharmap
};

interface UseSlugOptions {
    /**
     * Whether to automatically generate slug when title changes
     * @default true
     */
    autoGenerate?: boolean;
    
    /**
     * Custom replacement character for spaces
     * @default '-'
     */
    replacement?: string;
    
    /**
     * Whether to convert to lowercase
     * @default true
     */
    lower?: boolean;
    
    /**
     * Whether to remove symbols
     * @default false
     */
    remove?: RegExp | null;
}

interface UseSlugReturn {
    /**
     * Generate a slug from the given text
     */
    generateSlug: (text: string) => string;
    
    /**
     * Handle title change and optionally update slug
     */
    handleTitleChange: (
        title: string,
        currentSlug: string,
        originalTitle?: string,
        onTitleChange?: (title: string) => void,
        onSlugChange?: (slug: string) => void
    ) => void;
}

/**
 * Hook for generating URL-friendly slugs from text
 * Uses the 'slug' npm package for consistent, reliable slug generation
 */
export function useSlug(options: UseSlugOptions = {}): UseSlugReturn {
    const {
        autoGenerate = true,
        replacement = '-',
        lower = true,
        remove = null
    } = options;

    const generateSlug = useCallback((text: string): string => {
        if (!text) return '';
        
        return slug(text, {
            replacement,
            lower,
            remove: remove || undefined,
        });
    }, [replacement, lower, remove]);

    const handleTitleChange = useCallback((
        title: string,
        currentSlug: string,
        originalTitle?: string,
        onTitleChange?: (title: string) => void,
        onSlugChange?: (slug: string) => void
    ) => {
        // Always update the title
        if (onTitleChange) {
            onTitleChange(title);
        }

        // Auto-generate slug if enabled and conditions are met
        if (autoGenerate && onSlugChange) {
            const shouldUpdateSlug = (
                // No current slug exists
                !currentSlug ||
                // Current slug matches what would be generated from the original title
                (originalTitle && currentSlug === generateSlug(originalTitle)) ||
                // Current slug matches what would be generated from the previous title value
                currentSlug === generateSlug(originalTitle || '')
            );

            if (shouldUpdateSlug) {
                onSlugChange(generateSlug(title));
            }
        }
    }, [autoGenerate, generateSlug]);

    return {
        generateSlug,
        handleTitleChange,
    };
}
