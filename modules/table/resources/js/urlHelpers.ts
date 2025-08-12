import { router } from '@inertiajs/react';
import type {
    ActionItem,
    GetActionForItemFunction,
    GetClickableColumnFunction,
    ReplaceUrlFunction,
    VisitModalFunction,
    VisitUrlFunction,
} from './types/url';

// React/Inertia.js URL helpers for table navigation
export const visitUrl: VisitUrlFunction = (url) => {
    if (!url) {
        return; // Don't navigate if URL is null/undefined/empty
    }
    router.visit(url);
};

export const visitModal: VisitModalFunction = (url, modalCallback) => {
    if (!url) {
        return; // Don't navigate if URL is null/undefined/empty
    }
    if (modalCallback && typeof modalCallback === 'function') {
        return modalCallback(url);
    }
    // Fallback to regular navigation
    router.visit(url);
};

export const replaceUrl: ReplaceUrlFunction = (url) => {
    if (!url) {
        return; // Don't navigate if URL is null/undefined/empty
    }
    router.visit(url, { replace: true });
};

export const getClickableColumn: GetClickableColumnFunction = (column, item) => {
    // Check if we have valid column and item
    if (!column || !item) {
        return null;
    }

    // Check for column URLs from backend (_column_urls)
    if (item._column_urls && item._column_urls[column.attribute]) {
        return item._column_urls[column.attribute];
    }

    // If the column has a url property, use it
    if (column.url) {
        // If it's a function, call it with the item
        if (typeof column.url === 'function') {
            return column.url(item);
        }
        // If it's a string, use it as is
        return column.url;
    }

    // If the item has a URL property for this column
    if (item[column.attribute + '_url']) {
        return item[column.attribute + '_url'];
    }

    // If the item has a generic URL (check _row_url first, then _url, then url)
    if (item._row_url || item._url || item.url) {
        return item._row_url || item._url || item.url;
    }

    return null;
};

export const getActionForItem: GetActionForItemFunction = (actionData, action) => {
    // Handle different action data formats from backend
    if (!actionData) return null;

    // If actionData is a string (URL), create a basic ActionItem
    if (typeof actionData === 'string') {
        return {
            id: 'link',
            label: '',
            type: 'link',
            bindings: { href: actionData },
            isVisible: true,
            componentType: 'a',
        } as ActionItem;
    }

    // If actionData is already an ActionItem, return it
    if (typeof actionData === 'object' && actionData !== null) {
        return actionData as ActionItem;
    }

    return null;
};
