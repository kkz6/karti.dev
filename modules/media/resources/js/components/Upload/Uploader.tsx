import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MediaUpload } from '../../types/media';

interface UploaderProps {
    domElement?: HTMLDivElement | null;
    container?: string | null;
    path?: string | null;
    onProgress?: (upload: MediaUpload) => void;
    onUploadComplete?: (item: any, uploads: MediaUpload[]) => void;
    onError?: (error: string) => void;
    onUpdated?: (uploads: MediaUpload[]) => void;
}

export interface UploaderRef {
    browse: () => void;
    upload: (file: File) => void;
    clear: (uploadId: string) => void;
    clearAll: () => void;
}

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

export const Uploader = React.forwardRef<UploaderRef, UploaderProps>(
    ({ container = null, path = null, onUploadComplete, onError, onUpdated }, ref) => {
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [uploads, setUploads] = useState<MediaUpload[]>([]);

        const generateId = (): string => {
            return (1e7 + -1e3 + -4e3 + -8e3 + -1e11)
                .toString()
                .replace(/[018]/g, (c: any) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
        };

        const browse = useCallback(() => {
            fileInputRef.current?.click();
        }, []);

        const selectFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (files && files.length > 0) {
                Array.from(files).forEach(upload);
            }
            if (event.target) {
                event.target.value = '';
            }
        }, []);

        const upload = useCallback(
            async (file: File) => {
                const uuid = generateId();
                if (file.size > MAX_UPLOAD_SIZE) {
                    const errorMessage = `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum file size is 25 MB.`;
                    setUploads((prev) => [
                        ...prev,
                        { id: uuid, name: file.name, progress: 0, status: 'error' as const, error: errorMessage },
                    ]);
                    onError?.(errorMessage);
                    return;
                }

                const newUpload: MediaUpload = {
                    id: uuid,
                    name: file.name,
                    progress: 0,
                    status: 'uploading',
                };

                setUploads((prev) => [...prev, newUpload]);

                const formData = new FormData();
                formData.append('file', file);
                formData.append('disk', container || 'public');
                formData.append('path', path || '');

                try {
                    const response = await axios.post(route('media.create'), formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                setUploads((prev) => prev.map((u) => (u.id === uuid ? { ...u, progress } : u)));
                            }
                        },
                    });

                    if (response.status === 200 || response.status === 201) {
                        const mediaArray = Array.isArray(response.data) ? response.data : [response.data];
                        const uploadedMedia = mediaArray[0];

                        // Mark upload as completed but keep it visible for a moment
                        setUploads((prev) => prev.map((u) => (u.id === uuid ? { ...u, status: 'completed' as const, progress: 100 } : u)));
                        
                        onUploadComplete?.(
                            uploadedMedia,
                            uploads.filter((u) => u.id !== uuid),
                        );
                        
                        // Remove the upload after showing success for 4 seconds
                        setTimeout(() => {
                            setUploads((prev) => prev.filter((u) => u.id !== uuid));
                        }, 4000);
                    } else {
                        setUploads((prev) => prev.map((u) => (u.id === uuid ? { ...u, status: 'error' as const, error: 'Upload failed' } : u)));
                        onError?.('Upload failed');
                        
                    }
                } catch (error: any) {
                    let errorMessage = 'Network error';

                    if (error.response) {
                        if (error.response.status === 413) {
                            errorMessage = error.response.data?.message || 'This file exceeds the 25 MB upload limit.';
                        } else if (error.response.status === 409) {
                            errorMessage = error.response.data?.message || `A file named "${file.name}" already exists in this folder.`;
                        } else if (error.response.status === 422) {
                            errorMessage = error.response.data?.message || 'Invalid file type or format';
                        } else if (error.response.status >= 500) {
                            errorMessage = 'Server error occurred during upload. Please try again.';
                        } else {
                            errorMessage = error.response.data?.message || 'Upload failed';
                        }
                    }

                    setUploads((prev) => prev.map((u) => (u.id === uuid ? { ...u, status: 'error' as const, error: errorMessage } : u)));
                    onError?.(errorMessage);
                    
                }
            },
            [container, path, onUploadComplete, onError, uploads],
        );

        const clear = useCallback((uploadId: string) => {
            setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
        }, []);

        const clearAll = useCallback(() => {
            setUploads([]);
        }, []);

        React.useImperativeHandle(ref, () => ({ browse, upload, clear, clearAll }), [browse, clear, clearAll, upload]);

        useEffect(() => {
            onUpdated?.(uploads);
        }, [uploads, onUpdated]);

        return (
            <div className="asset-uploader">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={selectFile} />
            </div>
        );
    },
);
