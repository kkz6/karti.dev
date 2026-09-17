export interface MediaAsset {
    id: string;
    disk: string;
    directory: string;
    filename: string;
    title?: string;
    alt?: string;
    extension: string;
    mime_type: string;
    aggregate_type: string;
    size: number;
    variant_name?: string;
    original_media_id?: number;
    credit?: string;
    caption?: string;
    focus?: string;
    created_at: string;
    updated_at: string;
    container_id: string;

    // Computed properties
    is_image: boolean;
    is_audio: boolean;
    is_video: boolean;
    url: string;
    thumbnail_url?: string;
    image_urls?: Record<string, string>;
    preview?: string;
    path: string;
    formatted_size: string;
    photo_metadata?: {
        version: number;
        status: 'pending' | 'available' | 'empty' | 'unsupported' | 'unavailable' | 'error';
        fields: {
            camera_make?: string;
            camera_model?: string;
            lens?: string;
            aperture?: number;
            focal_length?: number;
            exposure_seconds?: number;
            iso?: number;
            orientation?: number;
            taken_at?: string;
        };
    } | null;
    dimensions?: {
        width: number;
        height: number;
    } | null;
}

export interface MediaFolder {
    uuid: string;
    path: string;
    title: string;
    parent_path: string | null;
    parent?: MediaFolder;
    created_at: string;
    updated_at: string;
}

export interface MediaContainer {
    id: string;
    title: string;
    uuid: string;
    item_id: string;
}

export interface MediaPagination {
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
}

export interface MediaLoadParams {
    container: string;
    path: string;
    page: number;
    sort: string;
    dir: 'asc' | 'desc';
    path_uuid?: string;
}

export interface MediaSearchParams {
    term: string;
    container: string;
    folder: string;
    restrictNavigation: boolean;
}

export interface MediaMoveParams {
    assets: string[];
    folder: string;
    container: string;
}

export interface MediaUpload {
    id: string;
    name: string;
    destination?: string;
    unconfirmed?: boolean;
    progress: number;
    status: 'queued' | 'uploading' | 'complete' | 'completed' | 'error';
    error?: string;
}

export type DisplayMode = 'grid' | 'table';
export type SortOrder = 'asc' | 'desc';

export interface MediaBrowserData {
    assets: MediaAsset[];
    folders: MediaFolder[];
    folder: MediaFolder;
    pagination: MediaPagination;
}

export interface MediaEvents {
    'asset-selected': (asset: MediaAsset) => void;
    'asset-deselected': (assetId: string) => void;
    'asset-doubleclicked': (asset: MediaAsset) => void;
    'asset-editing': (assetId: string) => void;
    'asset-deleting': (assetId: string) => void;
    'folder-selected': (folder: MediaFolder) => void;
    'folder-editing': (folder: MediaFolder) => void;
    'folder-deleted': (folderId: string) => void;
    navigated: (container: string, path: string) => void;
    'selections-updated': (selections: string[]) => void;
}
