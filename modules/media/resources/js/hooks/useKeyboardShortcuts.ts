import { useCallback, useEffect } from 'react';

interface KeyboardShortcutHandlers {
    onUpload?: () => void;
    onRefresh?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    onEdit?: () => void;
    onBulkSelect?: () => void;
    onSelectAll?: () => void;
    onMove?: () => void;
    onLock?: () => void;
    onVisibility?: () => void;
    onEscape?: () => void;
    onEnter?: () => void;
    onBackspace?: () => void;
    onToggleSidebar?: () => void;
    onClearSearch?: () => void;
    onNavigation?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

interface UseKeyboardShortcutsProps {
    enabled?: boolean;
    handlers: KeyboardShortcutHandlers;
    disabled?: boolean;
}

export const useKeyboardShortcuts = ({ enabled = true, handlers, disabled = false }: UseKeyboardShortcutsProps) => {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled || disabled) return;

            // Don't trigger shortcuts when typing in inputs
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
                // Only allow escape to work in inputs
                if (event.key === 'Escape') {
                    handlers.onEscape?.();
                }
                return;
            }

            // Don't trigger if modifier keys are pressed (except for specific combinations)
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            switch (event.key.toLowerCase()) {
                case 'u':
                    event.preventDefault();
                    handlers.onUpload?.();
                    break;

                case 'r':
                    event.preventDefault();
                    handlers.onRefresh?.();
                    break;

                case 'delete':
                case 'd':
                    event.preventDefault();
                    handlers.onDelete?.();
                    break;

                case 'f2':
                    event.preventDefault();
                    handlers.onRename?.();
                    break;

                case 'e':
                    event.preventDefault();
                    handlers.onEdit?.();
                    break;

                case 'b':
                    event.preventDefault();
                    handlers.onBulkSelect?.();
                    break;

                case 'a':
                    event.preventDefault();
                    handlers.onSelectAll?.();
                    break;

                case 'm':
                case 'p':
                    event.preventDefault();
                    handlers.onMove?.();
                    break;

                case 'l':
                    event.preventDefault();
                    handlers.onLock?.();
                    break;

                case 'v':
                    event.preventDefault();
                    handlers.onVisibility?.();
                    break;

                case 'escape':
                    event.preventDefault();
                    handlers.onEscape?.();
                    break;

                case 'enter':
                    event.preventDefault();
                    handlers.onEnter?.();
                    break;

                case 'backspace':
                    event.preventDefault();
                    handlers.onBackspace?.();
                    break;

                case 't':
                    event.preventDefault();
                    handlers.onToggleSidebar?.();
                    break;

                case '/':
                    event.preventDefault();
                    // Focus search input
                    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.focus();
                    }
                    break;

                case 'arrowup':
                    event.preventDefault();
                    handlers.onNavigation?.('up');
                    break;

                case 'arrowdown':
                    event.preventDefault();
                    handlers.onNavigation?.('down');
                    break;

                case 'arrowleft':
                    event.preventDefault();
                    handlers.onNavigation?.('left');
                    break;

                case 'arrowright':
                    event.preventDefault();
                    handlers.onNavigation?.('right');
                    break;

                case ' ':
                    // Space for preview (only if not in input)
                    if (activeElement?.tagName !== 'BUTTON') {
                        event.preventDefault();
                        // Could trigger preview modal
                    }
                    break;
            }
        },
        [enabled, disabled, handlers],
    );

    useEffect(() => {
        if (enabled && !disabled) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [enabled, disabled, handleKeyDown]);

    return {
        // Return any utility functions if needed
    };
};

// Hook for handling file navigation with arrow keys
export const useFileNavigation = (files: any[], selectedIndex: number, onSelect: (index: number) => void, columns: number = 6) => {
    const navigate = useCallback(
        (direction: 'up' | 'down' | 'left' | 'right') => {
            if (files.length === 0) return;

            let newIndex = selectedIndex;

            switch (direction) {
                case 'up':
                    newIndex = Math.max(0, selectedIndex - columns);
                    break;
                case 'down':
                    newIndex = Math.min(files.length - 1, selectedIndex + columns);
                    break;
                case 'left':
                    newIndex = Math.max(0, selectedIndex - 1);
                    break;
                case 'right':
                    newIndex = Math.min(files.length - 1, selectedIndex + 1);
                    break;
            }

            if (newIndex !== selectedIndex) {
                onSelect(newIndex);

                // Scroll into view
                const element = document.querySelector(`[data-file-index="${newIndex}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        },
        [files.length, selectedIndex, onSelect, columns],
    );

    return { navigate };
};
