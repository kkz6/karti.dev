import React, { useCallback, useEffect, useState } from 'react';
import { AssetBrowser } from './AssetBrowser';

interface AssetManagerProps {
    container?: string | null;
    path?: string | null;
}

/**
 * Get path from URL query parameter
 */
const getPathFromUrl = (): string => {
    const params = new URLSearchParams(window.location.search);
    return params.get('path') || '/';
};

/**
 * Update URL query parameter without page reload
 */
const updateUrlPath = (path: string): void => {
    const url = new URL(window.location.href);
    if (path === '/' || path === '') {
        url.searchParams.delete('path');
    } else {
        url.searchParams.set('path', path);
    }
    window.history.pushState({}, '', url.toString());
};

export const AssetManager: React.FC<AssetManagerProps> = ({ container = null, path = null }) => {
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    // Initialize from URL query param, fallback to prop, then default to '/'
    const [activePath, setActivePath] = useState<string>(() => getPathFromUrl() || path || '/');
    const [activeContainer, setActiveContainer] = useState<string | null>(container);

    // Listen for browser back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            const urlPath = getPathFromUrl();
            setActivePath(urlPath);
            setSelectedAssets([]);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    /**
     * When admin has navigated to another folder or container
     */
    const navigate = useCallback((containerId: string, newPath: string, selections: string[] = []) => {
        setActiveContainer(containerId);
        setActivePath(newPath);

        // Update URL query parameter
        updateUrlPath(newPath);

        // Ordinary navigation clears selection; a completed move follows its files
        // and preserves their IDs in the destination folder.
        setSelectedAssets(selections);
    }, []);

    /**
     * When selections are changed, we need them reflected here.
     */
    const updateSelections = useCallback((selections: string[]) => {
        setSelectedAssets(selections);
    }, []);

    return (
        <div className="asset-manager relative flex h-full min-h-0 flex-col">
            <AssetBrowser
                indexPage
                selectedContainer={activeContainer}
                selectedPath={activePath}
                selectedAssets={selectedAssets}
                canEdit={true}
                onNavigated={navigate}
                onSelectionsUpdated={updateSelections}
            />
        </div>
    );
};
