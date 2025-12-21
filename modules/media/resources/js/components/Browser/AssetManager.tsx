import React, { useCallback, useEffect, useState } from 'react';
import { AssetBrowser } from './AssetBrowser';
import { AssetMover } from './AssetMover';

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
    const [showAssetMover, setShowAssetMover] = useState<boolean>(false);
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
    const navigate = useCallback((containerId: string, newPath: string) => {
        setActiveContainer(containerId);
        setActivePath(newPath);

        // Update URL query parameter
        updateUrlPath(newPath);

        // Clear out any selections. It would be confusing to navigate to a different
        // folder and/or container, perform an action, and discover you performed
        // it on an asset that was still selected, but no longer visible.
        setSelectedAssets([]);
    }, []);

    /**
     * When selections are changed, we need them reflected here.
     */
    const updateSelections = useCallback((selections: string[]) => {
        setSelectedAssets(selections);
    }, []);

    const openAssetMover = useCallback(() => {
        setShowAssetMover(true);
    }, []);

    const deleteSelected = useCallback(() => {
        // Emit custom event for asset deletion
        const event = new CustomEvent('delete-assets', {
            detail: selectedAssets,
        });
        window.dispatchEvent(event);
    }, [selectedAssets]);

    const closeAssetMover = useCallback(() => {
        setShowAssetMover(false);
    }, []);

    const assetsMoved = useCallback(
        (folder: string) => {
            closeAssetMover();
            navigate(activeContainer!, folder);
        },
        [closeAssetMover, navigate, activeContainer],
    );

    return (
        <div className="asset-manager relative flex h-full flex-col">
            <AssetBrowser
                selectedContainer={activeContainer}
                selectedPath={activePath}
                selectedAssets={selectedAssets}
                canEdit={true}
                onNavigated={navigate}
                onSelectionsUpdated={updateSelections}
                onMoveAssets={openAssetMover}
            />

            {showAssetMover && (
                <AssetMover
                    assets={selectedAssets}
                    container={activeContainer}
                    folder={activePath}
                    onSaved={assetsMoved}
                    onClosed={closeAssetMover}
                />
            )}
        </div>
    );
};
