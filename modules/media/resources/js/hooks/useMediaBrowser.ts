import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MediaAsset,
  MediaFolder,
  MediaContainer,
  MediaBrowserData,
  MediaLoadParams,
  MediaSearchParams,
  MediaMoveParams,
  DisplayMode,
  SortOrder,
  MediaUpload
} from '../types/media';

// Service interface for media operations
interface MediaServices {
  browseContainer: () => Promise<{ data: { items: MediaContainer[] } }>;
  loadFilesService: (params: MediaLoadParams) => Promise<{ data: { data: MediaBrowserData; pagination: any } }>;
  searchFilesService: (params: MediaSearchParams) => Promise<{ data: { assets: MediaAsset[]; folders: MediaFolder[] } }>;
  moveFilesService: (params: MediaMoveParams) => Promise<void>;
  deleteFilesService: (params: { ids: string[] }) => Promise<void>;
}

import axios from 'axios';

// Default service implementation using axios API calls
export const createDefaultServices = (): MediaServices => ({
  browseContainer: async () => {
    const response = await axios.get(route('media.index'));
    return response.data;
  },

  loadFilesService: async (params: MediaLoadParams) => {
    const response = await axios.get('/api/media/get-files', { params });
    return response.data;
  },

  searchFilesService: async (params: MediaSearchParams) => {
    const response = await axios.get('/api/media/search', { params });
    return response.data;
  },

  moveFilesService: async (params: MediaMoveParams) => {
    const response = await axios.post('/api/media/move', params);
    return response.data;
  },

  deleteFilesService: async (params: { ids: string[] }) => {
    const response = await axios.delete('/api/media/delete', { data: params });
    return response.data;
  },
});

export function useMediaBrowser(
  initialContainer: string | null,
  initialPath: string | null,
  services: MediaServices = createDefaultServices()
) {
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

  // Load containers
  const loadContainers = useCallback(async () => {
    try {
      const response = await services.browseContainer();
      const containersData = response.data.items.reduce((acc, container) => {
        acc[container.id] = container;
        return acc;
      }, {} as Record<string, MediaContainer>);
      
      setContainers(containersData);
      
      // Set initial container - either the specified one or the first available
      const targetContainer = initialContainer 
        ? containersData[initialContainer] 
        : Object.values(containersData)[0] || null;
      
      setContainer(targetContainer);
      setLoadingContainers(false);
    } catch (error) {
      console.error('Error loading containers:', error);
      setLoadingContainers(false);
    }
  }, [initialContainer, services]);

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
  const deleteAssets = useCallback(async (ids: string[]) => {
    setLoadingAssets(true);
    try {
      await services.deleteFilesService({ ids });
      await loadAssets();
      setSelectedAssets(prev => prev.filter(id => !ids.includes(id)));
    } catch (error) {
      console.error('Error deleting assets:', error);
    }
    setLoadingAssets(false);
  }, [services, loadAssets]);

  // Move assets
  const moveAssets = useCallback(async (assetIds: string[], targetFolder: string) => {
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
  }, [container, services, loadAssets]);

  // Navigation
  const navigate = useCallback((containerId: string, newPath: string) => {
    if (containers[containerId]) {
      setContainer(containers[containerId]);
      setPath(newPath);
      setSelectedAssets([]);
    }
  }, [containers]);

  const selectFolder = useCallback((folderData: MediaFolder) => {
    setPath(folderData.path);
    setPathUuid(folderData.uuid);
    setSelectedPage(1);
  }, []);

  const selectContainer = useCallback((containerId: string) => {
    if (containers[containerId]) {
      setContainer(containers[containerId]);
      setPath('/');
    }
  }, [containers]);

  // Asset selection
  const selectAsset = useCallback((assetId: string) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) return prev;
      return [...prev, assetId];
    });
  }, []);

  const deselectAsset = useCallback((assetId: string) => {
    setSelectedAssets(prev => prev.filter(id => id !== assetId));
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedAssets([]);
  }, []);

  // Sorting
  const sortBy = useCallback((field: string) => {
    if (isSearching) return;

    let order: SortOrder = 'asc';
    if (sort === field) {
      order = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    setSort(field);
    setSortOrder(order);
  }, [isSearching, sort, sortOrder]);

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
      Array.from(files).forEach(file => {
        uploaderRef.current.upload(file);
      });
    }
    setDraggingFile(false);
  }, []);

  // Effects
  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  useEffect(() => {
    if (container) {
      loadAssets();
    }
  }, [container, path, selectedPage, sort, sortOrder, pathUuid, loadAssets]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      search();
    } else if (searchTerm.length === 0 && isSearching) {
      loadAssets();
    }
  }, [searchTerm, search, loadAssets, isSearching]);

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
    loadContainers,
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
    setDraggingFile,
    setUploads,
    // Refs
    uploaderRef,
    elementRef,
  };
}
