import { router } from '@inertiajs/react';
import type { Action } from './types';
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

export const getActionForItem: GetActionForItemFunction = (actions, item) => {
    // Get the appropriate action for an item
    if (!actions || !Array.isArray(actions)) return null;

    return (
        actions.find((action: Action | ActionItem) => {
            // Simple action matching logic
            if ('when' in action && action.when && typeof action.when === 'function') {
                return action.when(item);
            }
            return true;
        }) ||
        actions[0] ||
        null
    );
};
