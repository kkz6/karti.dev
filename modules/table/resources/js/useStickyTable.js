import { useEffect, useRef, useCallback } from 'react';

// React hooks for sticky table functionality
export const useStickyColumns = (getTableContainer) => {
    const isActiveRef = useRef(false);

    const add = useCallback(() => {
        if (isActiveRef.current) return;

        const tableContainer = typeof getTableContainer === 'function' ? getTableContainer() : null;
        if (!tableContainer) return;

        isActiveRef.current = true;

        // Add sticky column classes and attributes
        tableContainer.setAttribute('data-scroll-x', '');

        // Set up scroll listener for sticky column effects
        const handleScroll = () => {
            if (tableContainer.scrollLeft > 0) {
                tableContainer.setAttribute('data-scroll-x', '');
            } else {
                tableContainer.removeAttribute('data-scroll-x');
            }
        };

        tableContainer.addEventListener('scroll', handleScroll);

        // Store cleanup function
        tableContainer._stickyColumnsCleanup = () => {
            tableContainer.removeEventListener('scroll', handleScroll);
            tableContainer.removeAttribute('data-scroll-x');
        };
    }, [getTableContainer]);

    const remove = useCallback(() => {
        if (!isActiveRef.current) return;

        const tableContainer = typeof getTableContainer === 'function' ? getTableContainer() : null;
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

export const useStickyHeader = (getTableContainer, getHeaderElement) => {
    const isActiveRef = useRef(false);

    const add = useCallback(() => {
        if (isActiveRef.current) return;

        const tableContainer = typeof getTableContainer === 'function' ? getTableContainer() : null;
        const headerElement = typeof getHeaderElement === 'function' ? getHeaderElement() : null;

        if (!tableContainer || !headerElement) return;

        isActiveRef.current = true;

        // Set up scroll listener for sticky header effects
        const handleScroll = () => {
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
        let scrollTimeout;
        const handleScrollStart = () => {
            tableContainer.setAttribute('data-is-scrolling-y', '');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                tableContainer.removeAttribute('data-is-scrolling-y');
            }, 150);
        };

        const scrollHandler = () => {
            handleScroll();
            handleScrollStart();
        };

        window.addEventListener('scroll', scrollHandler);
        tableContainer.addEventListener('scroll', scrollHandler);

        // Store cleanup function
        tableContainer._stickyHeaderCleanup = () => {
            window.removeEventListener('scroll', scrollHandler);
            tableContainer.removeEventListener('scroll', scrollHandler);
            tableContainer.removeAttribute('data-scroll-y');
            tableContainer.removeAttribute('data-is-scrolling-y');
            tableContainer.style.removeProperty('--header-offset');
            clearTimeout(scrollTimeout);
        };
    }, [getTableContainer, getHeaderElement]);

    const remove = useCallback(() => {
        if (!isActiveRef.current) return;

        const tableContainer = typeof getTableContainer === 'function' ? getTableContainer() : null;
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
