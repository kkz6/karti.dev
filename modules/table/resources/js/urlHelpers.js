import { router } from '@inertiajs/react'

// React/Inertia.js URL helpers for table navigation
export const visitUrl = (url) => {
    router.visit(url);
};

export const visitModal = (url, modalCallback) => {
    if (modalCallback && typeof modalCallback === 'function') {
        return modalCallback(url);
    }
    // Fallback to regular navigation
    router.visit(url);
};

export const replaceUrl = (url) => {
    router.visit(url, { replace: true });
};

export const getClickableColumn = (column, item) => {
    // Check if the column is clickable and return the URL
    if (!column || !column.clickable || !item) {
        return null;
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

    // If the item has a generic URL
    if (item._url || item.url) {
        return item._url || item.url;
    }

    return null;
};

export const getActionForItem = (actions, item) => {
    // Get the appropriate action for an item
    if (!actions || !Array.isArray(actions)) return null;

    return actions.find(action => {
        // Simple action matching logic
        if (action.when && typeof action.when === 'function') {
            return action.when(item);
        }
        return true;
    }) || actions[0] || null;
};
