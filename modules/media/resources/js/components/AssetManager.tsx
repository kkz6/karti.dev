import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@shared/components/ui/button';
import { AssetBrowser } from './Browser/AssetBrowser';
import { AssetMover } from './AssetMover';

interface AssetManagerProps {
  container?: string | null;
  path?: string | null;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  container = null,
  path = null
}) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showAssetMover, setShowAssetMover] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<string>(path || '/');
  const [activeContainer, setActiveContainer] = useState<string | null>(container);

  /**
   * Bind browser navigation features
   *
   * This will initialize the state for using the history API to allow
   * navigation back and forth through folders using browser buttons.
   */
  const bindBrowserNavigation = useCallback(() => {
    window.history.replaceState({
      container: activeContainer,
      path: activePath,
    }, "");
    
    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        setActiveContainer(e.state.container);
        setActivePath(e.state.path);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeContainer, activePath]);

  /**
   * Push a new state onto the browser's history
   */
  const pushState = useCallback(() => {
    let url = "/admin/media/browse/" + activeContainer;

    if (activePath !== "/") {
      url += "/" + activePath;
    }
    window.history.pushState(
      { container: activeContainer, path: activePath },
      "", 
      url
    );
  }, [activeContainer, activePath]);

  /**
   * When admin has navigated to another folder or container
   */
  const navigate = useCallback((containerId: string, newPath: string) => {
    setActiveContainer(containerId);
    setActivePath(newPath);
    pushState();

    // Clear out any selections. It would be confusing to navigate to a different
    // folder and/or container, perform an action, and discover you performed
    // it on an asset that was still selected, but no longer visible.
    setSelectedAssets([]);
  }, [pushState]);

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
      detail: selectedAssets 
    });
    window.dispatchEvent(event);
  }, [selectedAssets]);

  const closeAssetMover = useCallback(() => {
    setShowAssetMover(false);
  }, []);

  const assetsMoved = useCallback((folder: string) => {
    closeAssetMover();
    navigate(activeContainer!, folder);
  }, [closeAssetMover, navigate, activeContainer]);

  useEffect(() => {
    const cleanup = bindBrowserNavigation();
    return cleanup;
  }, [bindBrowserNavigation]);

  return (
    <div className="asset-manager relative flex flex-col h-full">
      <AssetBrowser
        selectedContainer={activeContainer}
        selectedPath={activePath}
        selectedAssets={selectedAssets}
        onNavigated={navigate}
        onSelectionsUpdated={updateSelections}
      >
        {selectedAssets.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="destructive"
              onClick={deleteSelected}
              className="ml-16 mr-2"
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedAssets([])}
              >
                Uncheck all
              </Button>
              <Button
                variant="outline"
                onClick={openAssetMover}
              >
                Move
              </Button>
            </div>
          </div>
        )}
      </AssetBrowser>
      
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
