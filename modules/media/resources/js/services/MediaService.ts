import axios, { AxiosResponse } from 'axios';
import { MediaAsset } from '../types/media';
import { handleError } from '../utils/errorHandler';

// Types based on the API response structure
export interface MediaFile {
    id: number;
    disk: string;
    directory: string;
    filename: string;
    extension: string;
    mime_type: string;
    aggregate_type: string;
    size: number;
    created_at: string;
    updated_at: string;
    url: string;
    basename: string;
}

export interface MediaFolder {
    name: string;
    timestamp: string | 'N/A';
}

export interface MediaApiResponse {
    subdirectories: MediaFolder[];
    media: MediaFile[];
    page_count: number;
}

export interface MediaListParams {
    path?: string;
    page?: number;
}

export interface MediaConfig {
    baseUrl: string;
    hideFilesExt: boolean;
    mimeTypes: Record<string, string[]>;
    broadcasting: boolean;
    gfi: boolean;
    ratioBar: boolean;
    previewFilesBeforeUpload: boolean;
}

export interface MediaRoutes {
    files: string;
    config: string;
    upload: string;
    lock: string;
    visibility: string;
    locked_list: string;
}

export interface MediaConfigResponse {
    config: MediaConfig;
    routes: MediaRoutes;
    translations: Record<string, string>;
}

export class MediaService {
    private baseUrl: string;

    constructor(baseUrl: string = '/admin/media') {
        this.baseUrl = baseUrl;
        this.setupAxiosDefaults();
    }

    private setupAxiosDefaults(): void {
        // Setup CSRF token for all requests
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    }

    /**
     * Get media manager configuration
     */
    async getConfig(): Promise<MediaConfigResponse> {
        try {
            const response: AxiosResponse<MediaConfigResponse> = await axios.get(`${this.baseUrl}/config`);
            return response.data;
        } catch (error) {
            console.error('Error fetching media config:', error);
            throw new Error(`Failed to fetch media config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get files and folders from the media manager
     */
    async getFiles(params: MediaListParams = {}): Promise<MediaApiResponse> {
        try {
            const path = params.path && params.path !== '/' ? `/${params.path.replace(/^\//, '')}` : '';

            const queryParams = new URLSearchParams();
            if (params.page) {
                queryParams.append('page', params.page.toString());
            }

            const url = `${this.baseUrl}${path}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response: AxiosResponse<MediaApiResponse> = await axios.get(url);

            return response.data;
        } catch (error) {
            console.error('Error fetching media files:', error);
            throw new Error(`Failed to fetch media files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Upload files to the media manager
     */
    async uploadFiles(files: FileList, uploadPath: string = ''): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('upload_path', uploadPath);

            Array.from(files).forEach((file) => {
                formData.append('files[]', file);
            });

            const response = await axios.post(`${this.baseUrl}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        console.log(`Upload progress: ${progress}%`);
                    }
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Error uploading files:', error);

            let errorMessage = 'Failed to upload files';

            if (error.response) {
                if (error.response.status === 413) {
                    errorMessage = 'File size is too large. Please choose a smaller file.';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else {
                    errorMessage = `Upload failed (${error.response.status})`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    }

    /**
     * Delete a media file
     */
    async deleteFile(mediaId: number): Promise<void> {
        try {
            await axios.delete(`${this.baseUrl}/${mediaId}`);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete multiple media files
     */
    async deleteFiles(mediaIds: number[]): Promise<void> {
        try {
            const deletePromises = mediaIds.map((id) => this.deleteFile(id));
            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Error deleting files:', error);
            throw new Error(`Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create a new folder
     */
    async createFolder(folderName: string, currentPath: string = '/'): Promise<any> {
        try {
            const fullPath = `${currentPath.replace(/\/$/, '')}/${folderName}`.replace(/^\/+/, '');

            const response = await axios.post(`${this.baseUrl}/create`, {
                path: fullPath,
            });

            return response.data;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async deleteFolder(path: string): Promise<any> {
        try {
            const response = await axios.delete('/admin/media-manager/folder', {
                data: {
                    path,
                },
            });

            return response.data;
        } catch (error) {
            handleError(error, 'Failed to delete folder');
            throw error;
        }
    }

    /**
     * Move files to a different location
     */
    async moveFiles(mediaIds: number[], destination: string): Promise<any> {
        try {
            const response = await axios.post(`${this.baseUrl}/move`, {
                media_ids: mediaIds,
                destination,
            });

            return response.data;
        } catch (error) {
            console.error('Error moving files:', error);
            throw new Error(`Failed to move files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Rename a file
     */
    async renameFile(mediaId: number, newName: string): Promise<any> {
        try {
            const response = await axios.patch(`${this.baseUrl}/${mediaId}`, {
                filename: newName,
            });

            return response.data;
        } catch (error) {
            console.error('Error renaming file:', error);
            throw new Error(`Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get file details
     */
    async getFileDetails(mediaId: number): Promise<MediaAsset> {
        try {
            const response: AxiosResponse<MediaAsset> = await axios.post(`${this.baseUrl}/${mediaId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching file details:', error);
            throw new Error(`Failed to fetch file details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get multiple assets by their IDs
     */
    async getAssetsByIds(mediaIds: (string | number)[]): Promise<MediaAsset[]> {
        try {
            const promises = mediaIds.map(id => this.getFileDetails(typeof id === 'string' ? parseInt(id) : id));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error fetching assets by IDs:', error);
            throw new Error(`Failed to fetch assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// Export a singleton instance
export const mediaService = new MediaService();
