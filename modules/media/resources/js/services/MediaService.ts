import axios, { AxiosResponse } from 'axios';

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
    disk?: string;
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
            // Build URL with path if provided
            const path = params.path && params.path !== '/' ? `/${params.path.replace(/^\//, '')}` : '';

            // Add query parameters
            const queryParams = new URLSearchParams();
            if (params.disk) {
                queryParams.append('disk', params.disk);
            }
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
    async uploadFiles(files: FileList, uploadPath: string = '', disk: string = 'public'): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('disk', disk);
            formData.append('upload_path', uploadPath);

            // Add all files to the form data
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
                        // You can emit an event or call a callback here for progress updates
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
    async createFolder(folderName: string, currentPath: string = '/', disk: string = 'public'): Promise<any> {
        try {
            const fullPath = `${currentPath.replace(/\/$/, '')}/${folderName}`.replace(/^\/+/, '');

            const response = await axios.post(`${this.baseUrl}/create`, {
                path: fullPath,
                disk,
            });

            return response.data;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Move files to a different location
     */
    async moveFiles(mediaIds: number[], destination: string, disk: string = 'public'): Promise<any> {
        try {
            const response = await axios.post(`${this.baseUrl}/move`, {
                media_ids: mediaIds,
                destination,
                disk,
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
    async getFileDetails(mediaId: number): Promise<MediaFile> {
        try {
            const response: AxiosResponse<MediaFile> = await axios.post(`${this.baseUrl}/${mediaId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching file details:', error);
            throw new Error(`Failed to fetch file details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// Export a singleton instance
export const mediaService = new MediaService();
