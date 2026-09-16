import { MediaAsset } from '@media/types/media';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { AssetBrowser } from '../Browser/AssetBrowser';
import { AssetPickerDialog } from './AssetPickerDialog';

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
    ({ container = null, folder = null, selected = [], maxFiles = null, restrictNavigation = false, canEdit = false, onClosed, onSelected }, ref) => {
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
            <AssetPickerDialog
                open
                title="Select assets"
                selectedCount={browserSelections.length}
                onClose={handleClose}
                onConfirm={handleSelect}
                onClear={handleUncheckAll}
            >
                <AssetBrowser
                    selectedContainer={container}
                    selectedPath={folder}
                    selectedAssets={browserSelections}
                    restrictNavigation={restrictNavigation}
                    maxFiles={maxFiles ?? undefined}
                    canEdit={canEdit}
                    onSelectionsUpdated={handleSelectionsUpdated}
                    onAssetDoubleClicked={handleAssetDoubleClicked}
                />
            </AssetPickerDialog>
        );
    },
);
