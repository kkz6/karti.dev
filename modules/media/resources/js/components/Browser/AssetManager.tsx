import React, { useCallback, useState } from 'react';
import { AssetBrowser } from './AssetBrowser';
import { AssetMover } from './AssetMover';

interface AssetManagerProps {
    container?: string | null;
    path?: string | null;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ container = null, path = null }) => {
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [showAssetMover, setShowAssetMover] = useState<boolean>(false);
    const [activePath, setActivePath] = useState<string>(path || '/');
    const [activeContainer, setActiveContainer] = useState<string | null>(container);

    /**
     * When admin has navigated to another folder or container
     */
    const navigate = useCallback((containerId: string, newPath: string) => {
        setActiveContainer(containerId);
        setActivePath(newPath);

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
