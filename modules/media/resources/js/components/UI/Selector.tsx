import { MediaAsset } from '@media/types/media';
import { Button } from '@shared/components/ui/button';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { AssetBrowser } from '../Browser/AssetBrowser';

interface SelectorProps {
    container?: string | null;
    folder?: string | null;
    selected?: string[];
    maxFiles?: number | null;
    restrictNavigation?: boolean;
    canEdit?: boolean;
    viewMode?: 'grid' | 'table';
    onClosed: () => void;
    onSelected: (selections: string[]) => void;
}

export interface SelectorRef {
    getSelectedAsset: () => MediaAsset | null;
}

export const Selector = forwardRef<SelectorRef, SelectorProps>(
    (
        {
            container = null,
            folder = null,
            selected = [],
            maxFiles = null,
            restrictNavigation = false,
            canEdit = false,
            viewMode = 'grid',
            onClosed,
            onSelected,
        },
        ref,
    ) => {
        const [browserSelections, setBrowserSelections] = useState<string[]>(selected);
        const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

        useImperativeHandle(ref, () => ({
            getSelectedAsset: () => selectedAsset,
        }));

        useEffect(() => {
            // Emit modal.open event when component mounts
            const event = new CustomEvent('modal.open');
            window.dispatchEvent(event);
        }, []);

        const handleSelect = () => {
            onSelected(browserSelections);
            handleClose();
        };

        const handleClose = () => {
            onClosed();
        };

        const handleSelectionsUpdated = (selections: string[]) => {
            setBrowserSelections(selections);
        };

        const handleAssetDoubleClicked = (asset: MediaAsset) => {
            setSelectedAsset(asset);
            setBrowserSelections([asset.id]);
            handleSelect();
        };

        const handleUncheckAll = () => {
            setBrowserSelections([]);
        };

        return (
            <div className="asset-selector-modal bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                <div className="asset-selector max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-lg">
                    <div className="flex-1 overflow-hidden">
                        <AssetBrowser
                            selectedContainer={container}
                            selectedPath={folder}
                            selectedAssets={browserSelections}
                            restrictNavigation={restrictNavigation}
                            maxFiles={maxFiles}
                            canEdit={canEdit}
                            onSelectionsUpdated={handleSelectionsUpdated}
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                        >
                            {browserSelections.length > 0 && (
                                <Button variant="outline" onClick={handleUncheckAll} className="mb-3">
                                    Uncheck all
                                </Button>
                            )}
                        </AssetBrowser>
                    </div>

                    <div className="flex items-center justify-between rounded-b-lg border-t border-gray-200 bg-gray-50 p-3">
                        <div className="text-sm text-gray-600">
                            {browserSelections.length > 0 && (
                                <>
                                    {browserSelections.length}
                                    {maxFiles && <span>/{maxFiles}</span>} Selected
                                </>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSelect} disabled={browserSelections.length === 0}>
                                Select
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);
