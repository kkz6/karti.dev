import { useCallback, useRef } from 'react';
import type { GetElementFunction, StickyTableHook } from './types';

// Extended HTMLElement interface to support custom cleanup functions
interface ExtendedHTMLElement extends HTMLElement {
    _stickyColumnsCleanup?: () => void;
    _stickyHeaderCleanup?: () => void;
}

// React hooks for sticky table functionality
export const useStickyColumns = (getTableContainer: GetElementFunction): StickyTableHook => {
    const isActiveRef = useRef<boolean>(false);

    const add = useCallback((): void => {
        if (isActiveRef.current) return;

        const tableContainer = getTableContainer() as ExtendedHTMLElement | null;
        if (!tableContainer) return;

        isActiveRef.current = true;

        // Add sticky column classes and attributes
        tableContainer.setAttribute('data-scroll-x', '');

        // Set up scroll listener for sticky column effects
        const handleScroll = (): void => {
            if (tableContainer.scrollLeft > 0) {
                tableContainer.setAttribute('data-scroll-x', '');
            } else {
                tableContainer.removeAttribute('data-scroll-x');
            }
        };

        tableContainer.addEventListener('scroll', handleScroll);

        // Store cleanup function
        tableContainer._stickyColumnsCleanup = (): void => {
            tableContainer.removeEventListener('scroll', handleScroll);
            tableContainer.removeAttribute('data-scroll-x');
        };
    }, [getTableContainer]);

    const remove = useCallback((): void => {
        if (!isActiveRef.current) return;

        const tableContainer = getTableContainer() as ExtendedHTMLElement | null;
        if (!tableContainer) return;

        isActiveRef.current = false;

        // Clean up
        if (tableContainer._stickyColumnsCleanup) {
            tableContainer._stickyColumnsCleanup();
            delete tableContainer._stickyColumnsCleanup;
        }
    }, [getTableContainer]);

    return { add, remove };
};

export const useStickyHeader = (getTableContainer: GetElementFunction, getHeaderElement: GetElementFunction): StickyTableHook => {
    const isActiveRef = useRef<boolean>(false);

    const add = useCallback((): void => {
        if (isActiveRef.current) return;

        const tableContainer = getTableContainer() as ExtendedHTMLElement | null;
        const headerElement = getHeaderElement();

        if (!tableContainer || !headerElement) return;

        isActiveRef.current = true;

        // Set up scroll listener for sticky header effects
        const handleScroll = (): void => {
            const rect = tableContainer.getBoundingClientRect();
            const headerRect = headerElement.getBoundingClientRect();

            if (rect.top < 0 && rect.bottom > headerRect.height) {
                tableContainer.setAttribute('data-scroll-y', '');
                tableContainer.style.setProperty('--header-offset', `${Math.abs(rect.top)}px`);
            } else {
                tableContainer.removeAttribute('data-scroll-y');
                tableContainer.style.removeProperty('--header-offset');
            }
        };

        // Check if we're scrolling
        let scrollTimeout: NodeJS.Timeout;
        const handleScrollStart = (): void => {
            tableContainer.setAttribute('data-is-scrolling-y', '');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                tableContainer.removeAttribute('data-is-scrolling-y');
            }, 150);
        };

        const scrollHandler = (): void => {
            handleScroll();
            handleScrollStart();
        };

        window.addEventListener('scroll', scrollHandler);
        tableContainer.addEventListener('scroll', scrollHandler);

        // Store cleanup function
        tableContainer._stickyHeaderCleanup = (): void => {
            window.removeEventListener('scroll', scrollHandler);
            tableContainer.removeEventListener('scroll', scrollHandler);
            tableContainer.removeAttribute('data-scroll-y');
            tableContainer.removeAttribute('data-is-scrolling-y');
            tableContainer.style.removeProperty('--header-offset');
            clearTimeout(scrollTimeout);
        };
    }, [getTableContainer, getHeaderElement]);

    const remove = useCallback((): void => {
        if (!isActiveRef.current) return;

        const tableContainer = getTableContainer() as ExtendedHTMLElement | null;
        if (!tableContainer) return;

        isActiveRef.current = false;

        // Clean up
        if (tableContainer._stickyHeaderCleanup) {
            tableContainer._stickyHeaderCleanup();
            delete tableContainer._stickyHeaderCleanup;
        }
    }, [getTableContainer, getHeaderElement]);

    return { add, remove };
};
