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

export const getClickableColumn = (columns) => {
    // Find the first clickable column
    return columns.find(column => column.clickable) || null;
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
