import { useCallback, useEffect, useRef, useState } from 'react';
import {
    DisplayMode,
    MediaAsset,
    MediaContainer,
    MediaFolder,
    MediaLoadParams,
    MediaMoveParams,
    MediaPagination,
    MediaSearchParams,
    MediaUpload,
    SortOrder,
} from '../types/media';

// Service interface for media operations
interface MediaServices {
    loadFilesService: (
        params: MediaLoadParams,
    ) => Promise<{ data: { data: { assets: MediaAsset[]; folders: MediaFolder[]; folder: MediaFolder }; pagination: MediaPagination } }>;
    searchFilesService: (params: MediaSearchParams) => Promise<{ data: { assets: MediaAsset[]; folders: MediaFolder[] } }>;
    moveFilesService: (params: MediaMoveParams) => Promise<void>;
    deleteFilesService: (params: { ids: string[] }) => Promise<{ success: boolean }>;
    downloadAssetService: (assetId: string) => Promise<void>;
}

import axios from 'axios';

// Default service implementation using axios API calls
export const createDefaultServices = (): MediaServices => ({
    loadFilesService: async (params: MediaLoadParams) => {
        // Call the Laravel media controller index method
        // The route now accepts path as a route parameter
        const url = params.path && params.path !== '/' ? `/admin/media/${params.path.replace(/^\//, '')}` : '/admin/media';

        const response = await axios.get(url, {
            params: {
                disk: 'public',
                page: params.page,
            },
        });

        // Transform the backend response to match frontend expectations
        const { subdirectories, media, page_count } = response.data;

        // Transform subdirectories to folders format
        const folders: MediaFolder[] = subdirectories.map((dir: any) => ({
            uuid: `folder-${dir.name}`,
            path: dir.name,
            title: dir.name.split('/').pop() || dir.name,
            parent_path: params.path === '/' ? null : params.path,
            container_id: 'public',
            created_at: dir.timestamp !== 'N/A' ? dir.timestamp : new Date().toISOString(),
            updated_at: dir.timestamp !== 'N/A' ? dir.timestamp : new Date().toISOString(),
        }));

        // Transform media to assets format
        const assets: MediaAsset[] = media.map((file: any) => ({
            id: file.id.toString(),
            title: file.basename || file.filename,
            filename: file.filename,
            extension: file.extension,
            mime_type: file.mime_type,
            size: file.size,
            url: file.url,
            thumbnail_url: file.aggregate_type === 'image' ? file.url : undefined,
            created_at: file.created_at,
            updated_at: file.updated_at,
            is_image: file.aggregate_type === 'image',
            path: file.directory,
            container_id: 'public',
            dimensions: undefined, // Backend doesn't provide dimensions yet
        }));

        // Create current folder object
        const folder: MediaFolder = {
            uuid: `folder-${params.path}`,
            path: params.path,
            title: params.path === '/' ? 'Root' : params.path.split('/').pop() || params.path,
            parent_path: params.path === '/' ? null : params.path.split('/').slice(0, -1).join('/') || '/',
            container_id: 'public',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Create pagination object
        const pagination: MediaPagination = {
            meta: {
                current_page: params.page,
                last_page: page_count,
                per_page: 20, // Backend uses 20 per page
                total: page_count * 20, // Approximate total
            },
            links: {
                first: params.page > 1 ? '1' : null,
                last: params.page < page_count ? page_count.toString() : null,
                prev: params.page > 1 ? (params.page - 1).toString() : null,
                next: params.page < page_count ? (params.page + 1).toString() : null,
            },
        };

        return {
            data: {
                data: {
                    assets,
                    folders,
                    folder,
                },
                pagination,
            },
        };
    },

    searchFilesService: async (params: MediaSearchParams) => {
        // Search is not yet implemented in the backend, return empty results
        return {
            data: {
                assets: [],
                folders: [],
            },
        };
    },

    moveFilesService: async (params: MediaMoveParams) => {
        // Call the backend move endpoint when it's available
        const response = await axios.post('/admin/media/move', {
            media_ids: params.assets.map((id) => parseInt(id)),
            destination: params.folder,
            disk: 'public',
        });
        return response.data;
    },

    deleteFilesService: async (params: { ids: string[] }) => {
        // Delete multiple files - backend expects individual deletes
        const deletePromises = params.ids.map((id) => axios.delete(`/admin/media/${id}`));
        await Promise.all(deletePromises);
        return { success: true };
    },

    downloadAssetService: async (assetId: string) => {
        // Create a temporary link and trigger download
        const response = await axios.get(`/admin/media/${assetId}/download`, {
            responseType: 'blob',
        });

        // Create a blob URL and trigger download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = ''; // Let the browser determine the filename from Content-Disposition
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
});

export function useMediaBrowser(initialContainer: string | null, initialPath: string | null, services: MediaServices = createDefaultServices()) {
    // State
    const [containers, setContainers] = useState<Record<string, MediaContainer>>({});
    const [container, setContainer] = useState<MediaContainer | null>(null);
    const [path, setPath] = useState<string>(initialPath || '/');
    const [pathUuid, setPathUuid] = useState<string | null>(null);
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [folder, setFolder] = useState<MediaFolder | null>(null);
    const [pagination, setPagination] = useState<any>({});
    const [selectedPage, setSelectedPage] = useState<number>(1);
    const [sort, setSort] = useState<string>('title');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [displayMode, setDisplayMode] = useState<DisplayMode>('table');
    const [uploads, setUploads] = useState<MediaUpload[]>([]);
    const [loadingContainers, setLoadingContainers] = useState<boolean>(true);
    const [loadingAssets, setLoadingAssets] = useState<boolean>(true);
    const [initializedAssets, setInitializedAssets] = useState<boolean>(false);
    const [draggingFile, setDraggingFile] = useState<boolean>(false);

    // Refs
    const uploaderRef = useRef<any>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    // Initialize containers (no API call needed, using default container)
    const initializeContainers = useCallback(() => {
        // Create a default public container
        const defaultContainer: MediaContainer = {
            id: 'public',
            title: 'Public',
            uuid: 'public-uuid',
            item_id: 'public',
        };

        const containersData = { public: defaultContainer };
        setContainers(containersData);
        setContainer(defaultContainer);
        setLoadingContainers(false);
    }, []);

    // Load assets
    const loadAssets = useCallback(async () => {
        if (!container) return;

        setLoadingAssets(true);
        try {
            const response = await services.loadFilesService({
                container: container.id,
                path,
                page: selectedPage,
                sort,
                dir: sortOrder,
                path_uuid: pathUuid || undefined,
            });

            setAssets(response.data.data.assets);
            setFolders(response.data.data.folders);
            setFolder(response.data.data.folder);
            setPagination(response.data.pagination);
            setSelectedPage(response.data.pagination.meta.current_page);
            setLoadingAssets(false);
            setInitializedAssets(true);
            setIsSearching(false);
        } catch (error) {
            console.error('Error loading assets:', error);
            setLoadingAssets(false);
        }
    }, [container, path, selectedPage, sort, sortOrder, pathUuid, services]);

    // Search assets
    const search = useCallback(async () => {
        if (!container || !folder) return;

        setLoadingAssets(true);
        setIsSearching(true);
        try {
            const response = await services.searchFilesService({
                term: searchTerm,
                container: container.id,
                folder: folder.path,
                restrictNavigation: false,
            });

            setIsSearching(false);
            setAssets(response.data.assets);
            setFolders([]);
            setLoadingAssets(false);
            setInitializedAssets(true);
        } catch (error) {
            console.error('Error searching assets:', error);
            setLoadingAssets(false);
            setIsSearching(false);
        }
    }, [container, folder, searchTerm, services]);

    // Delete assets
    const deleteAssets = useCallback(
        async (ids: string[]) => {
            setLoadingAssets(true);
            try {
                await services.deleteFilesService({ ids });
                await loadAssets();
                setSelectedAssets((prev) => prev.filter((id) => !ids.includes(id)));
            } catch (error) {
                console.error('Error deleting assets:', error);
            }
            setLoadingAssets(false);
        },
        [services, loadAssets],
    );

    // Move assets
    const moveAssets = useCallback(
        async (assetIds: string[], targetFolder: string) => {
            if (!container) return;

            try {
                await services.moveFilesService({
                    assets: assetIds,
                    folder: targetFolder,
                    container: container.id,
                });
                await loadAssets();
                setSelectedAssets([]);
            } catch (error) {
                console.error('Error moving assets:', error);
            }
        },
        [container, services, loadAssets],
    );

    // Navigation
    const navigate = useCallback(
        (containerId: string, newPath: string) => {
            if (containers[containerId]) {
                setContainer(containers[containerId]);
                setPath(newPath);
                setSelectedAssets([]);
            }
        },
        [containers],
    );

    const selectFolder = useCallback((folderData: MediaFolder) => {
        setPath(folderData.path);
        setPathUuid(folderData.uuid);
        setSelectedPage(1);
    }, []);

    const selectContainer = useCallback(
        (containerId: string) => {
            if (containers[containerId]) {
                setContainer(containers[containerId]);
                setPath('/');
            }
        },
        [containers],
    );

    // Asset selection
    const selectAsset = useCallback((assetId: string) => {
        setSelectedAssets((prev) => {
            if (prev.includes(assetId)) return prev;
            return [...prev, assetId];
        });
    }, []);

    const deselectAsset = useCallback((assetId: string) => {
        setSelectedAssets((prev) => prev.filter((id) => id !== assetId));
    }, []);

    const clearSelections = useCallback(() => {
        setSelectedAssets([]);
    }, []);

    // Sorting
    const sortBy = useCallback(
        (field: string) => {
            if (isSearching) return;

            let order: SortOrder = 'asc';
            if (sort === field) {
                order = sortOrder === 'asc' ? 'desc' : 'asc';
            }

            setSort(field);
            setSortOrder(order);
        },
        [isSearching, sort, sortOrder],
    );

    // Pagination
    const goToPage = useCallback((page: number) => {
        setSelectedPage(page);
    }, []);

    // Display mode
    const setDisplayModeWithCookie = useCallback((mode: DisplayMode) => {
        setDisplayMode(mode);
        // Save to cookie if needed
        document.cookie = `gigcodes.assets.listing_view_mode=${mode}; path=/`;
    }, []);

    // File upload
    const uploadFile = useCallback(() => {
        if (uploaderRef.current) {
            uploaderRef.current.browse();
        }
    }, []);

    const dropFile = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length && uploaderRef.current) {
            Array.from(files).forEach((file) => {
                uploaderRef.current.upload(file);
            });
        }
        setDraggingFile(false);
    }, []);

    const downloadAsset = useCallback(
        async (assetId: string) => {
            try {
                await services.downloadAssetService(assetId);
            } catch (error) {
                console.error('Error downloading asset:', error);
                throw error;
            }
        },
        [services],
    );

    // Effects
    useEffect(() => {
        initializeContainers();
    }, [initializeContainers]);

    useEffect(() => {
        if (container) {
            loadAssets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container, path, selectedPage, sort, sortOrder, pathUuid]);

    useEffect(() => {
        if (searchTerm.length >= 3) {
            search();
        } else if (searchTerm.length === 0 && isSearching) {
            loadAssets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, isSearching]);

    // Computed values
    const initialized = !loadingContainers && initializedAssets;
    const loading = loadingAssets || loadingContainers;
    const hasAssets = assets.length > 0;
    const hasSubfolders = folders.length > 0;
    const isEmpty = !hasAssets && !hasSubfolders;
    const showSidebar = initialized && !isSearching && Object.keys(containers).length > 1;

    return {
        // State
        containers,
        container,
        path,
        pathUuid,
        assets,
        folders,
        folder,
        pagination,
        selectedPage,
        sort,
        sortOrder,
        searchTerm,
        isSearching,
        selectedAssets,
        displayMode,
        uploads,
        loadingContainers,
        loadingAssets,
        initializedAssets,
        draggingFile,
        // Computed
        initialized,
        loading,
        hasAssets,
        hasSubfolders,
        isEmpty,
        showSidebar,
        // Actions
        loadContainers: initializeContainers,
        loadAssets,
        search,
        deleteAssets,
        moveAssets,
        navigate,
        selectFolder,
        selectContainer,
        selectAsset,
        deselectAsset,
        clearSelections,
        sortBy,
        goToPage,
        setDisplayMode: setDisplayModeWithCookie,
        setSearchTerm,
        uploadFile,
        dropFile,
        downloadAsset,
        setDraggingFile,
        setUploads,
        // Refs
        uploaderRef,
        elementRef,
    };
}
