import { useCallback, useRef, useState } from 'react';
import { MediaService } from '../services/MediaService';
import { AssetFieldConfig, AssetUpload } from '../types/asset-field';
import { MediaAsset } from '../types/media';

export interface UseAssetsFieldProps {
    initialAssets?: MediaAsset[];
    config?: AssetFieldConfig;
    onChange?: (assets: MediaAsset[]) => void;
    onError?: (error: string) => void;
}

export function useAssetsField({ initialAssets = [], config = {}, onChange, onError }: UseAssetsFieldProps = {}) {
    const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
    const [uploads, setUploads] = useState<AssetUpload[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [draggingFile, setDraggingFile] = useState(false);

    const mediaService = useRef(new MediaService());

    // Configuration computed values
    const maxFiles = config.max_files || 0;
    const maxFilesReached = maxFiles > 0 && assets.length >= maxFiles;
    const containerSpecified = !!config.container;

    // Load assets from IDs or asset objects
    const loadAssets = useCallback(
        async (assetData: (string | MediaAsset)[]) => {
            if (!assetData || !assetData.length) {
                setAssets([]);
                return;
            }

            try {
                setLoading(true);

                // If all items are already asset objects, use them directly
                const allAreObjects = assetData.every((item) => typeof item === 'object' && 'url' in item);

                if (allAreObjects) {
                    setAssets(assetData as MediaAsset[]);
                } else {
                    // For now, we'll assume asset data is already in the correct format
                    // TODO: Implement proper asset loading by IDs when the API supports it
                    console.warn('Asset loading by IDs not yet implemented');
                    setAssets([]);
                }
            } catch (error) {
                console.error('Error loading assets:', error);
                onError?.('Unable to load assets');
                setAssets([]);
            } finally {
                setLoading(false);
            }
        },
        [onError],
    );

    // Add asset
    const addAsset = useCallback(
        (asset: MediaAsset) => {
            if (maxFilesReached) return;

            setAssets((prev) => {
                const newAssets = [...prev, asset];
                onChange?.(newAssets);
                return newAssets;
            });
        },
        [maxFilesReached, onChange],
    );

    // Remove asset
    const removeAsset = useCallback(
        (assetToRemove: MediaAsset) => {
            setAssets((prev) => {
                const newAssets = prev.filter((asset) => asset.id !== assetToRemove.id);
                onChange?.(newAssets);
                return newAssets;
            });
        },
        [onChange],
    );

    // Update asset
    const updateAsset = useCallback(
        (updatedAsset: MediaAsset) => {
            setAssets((prev) => {
                const newAssets = prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset));
                onChange?.(newAssets);
                return newAssets;
            });
        },
        [onChange],
    );

    // Reorder assets
    const reorderAssets = useCallback(
        (fromIndex: number, toIndex: number) => {
            setAssets((prev) => {
                const newAssets = [...prev];
                const [removed] = newAssets.splice(fromIndex, 1);
                newAssets.splice(toIndex, 0, removed);
                onChange?.(newAssets);
                return newAssets;
            });
        },
        [onChange],
    );

    // Replace all assets
    const setAllAssets = useCallback(
        (newAssets: MediaAsset[]) => {
            setAssets(newAssets);
            onChange?.(newAssets);
        },
        [onChange],
    );

    // Selector handlers
    const openSelector = useCallback(() => {
        setShowSelector(true);
    }, []);

    const closeSelector = useCallback(() => {
        setShowSelector(false);
    }, []);

    // Drag handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
        return e.dataTransfer.files;
    }, []);

    // Upload handlers
    const handleUploadComplete = useCallback(
        (asset: MediaAsset) => {
            addAsset(asset);
        },
        [addAsset],
    );

    const handleUploadsUpdated = useCallback((newUploads: AssetUpload[]) => {
        setUploads(newUploads);
    }, []);

    const clearUpload = useCallback((uploadId: string) => {
        setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
    }, []);

    return {
        // State
        assets,
        uploads,
        loading,
        showSelector,
        draggingFile,

        // Computed
        maxFilesReached,
        containerSpecified,
        isEmpty: assets.length === 0,
        isSolo: maxFiles === 1,

        // Actions
        loadAssets,
        addAsset,
        removeAsset,
        updateAsset,
        reorderAssets,
        setAllAssets,

        // Selector
        openSelector,
        closeSelector,

        // Drag & Drop
        handleDragOver,
        handleDragLeave,
        handleDrop,

        // Upload
        handleUploadComplete,
        handleUploadsUpdated,
        clearUpload,
        setUploads,
    };
}
