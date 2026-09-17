import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MediaAsset, MediaUpload } from '../../types/media';
import { confirmedUpload, createUploadQueue, normalizeUploadPath } from '../../utils/upload-queue';

interface UploaderProps {
    domElement?: HTMLDivElement | null;
    container?: string | null;
    path?: string | null;
    onProgress?: (upload: MediaUpload) => void;
    onUploadComplete?: (item: MediaAsset, uploads: MediaUpload[]) => void;
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

function uploadErrorMessage(error: unknown, file: File): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : 'The upload could not be completed.';
    }

    const { response } = error;
    const data = response?.data;

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || !response || response.status >= 500) {
        return 'The server did not confirm this upload in time. Refresh the destination folder before retrying; the file may have been saved.';
    }

    if (data && typeof data === 'object') {
        if (typeof data.message === 'string' && data.message.trim()) {
            return data.message;
        }

        if (data.errors && typeof data.errors === 'object') {
            const validationMessage = Object.values(data.errors)
                .flat()
                .find((message): message is string => typeof message === 'string');

            if (validationMessage) {
                return validationMessage;
            }
        }
    }

    if (typeof data === 'string' && data.trim() && !data.trimStart().startsWith('<')) {
        return data;
    }

    if (response?.status === 413) {
        return `File "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the server upload limit.`;
    }

    return `Upload failed${response?.status ? ` (HTTP ${response.status})` : ''}: ${error.message}`;
}

export const Uploader = React.forwardRef<UploaderRef, UploaderProps>(
    ({ container = null, path = null, onUploadComplete, onError, onUpdated }, ref) => {
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [uploads, setUploads] = useState<MediaUpload[]>([]);
        const uploadsRef = useRef<MediaUpload[]>([]);
        const queue = useRef(createUploadQueue(2));
        const controllers = useRef(new Set<AbortController>());
        const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
        const mounted = useRef(true);
        const callbacks = useRef({ onUploadComplete, onError });
        callbacks.current = { onUploadComplete, onError };

        const updateUploads = useCallback((update: (items: MediaUpload[]) => MediaUpload[]) => {
            if (!mounted.current) return;
            uploadsRef.current = update(uploadsRef.current);
            setUploads(uploadsRef.current);
        }, []);

        useEffect(() => {
            mounted.current = true;
            const pending = queue.current;
            const requests = controllers.current;
            const timeouts = timers.current;
            return () => {
                mounted.current = false;
                pending.clear();
                requests.forEach((controller) => controller.abort());
                timeouts.forEach(clearTimeout);
                timeouts.clear();
            };
        }, []);

        const browse = useCallback(() => {
            fileInputRef.current?.click();
        }, []);

        const upload = useCallback(
            (file: File) => {
                const uuid = crypto.randomUUID();
                // Capture the destination at selection/drop time, not when a queued task starts.
                const destination = normalizeUploadPath(path);
                if (file.size > MAX_UPLOAD_SIZE) {
                    const errorMessage = `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum file size is 25 MB.`;
                    updateUploads((prev) => [
                        ...prev,
                        { id: uuid, name: file.name, destination, progress: 0, status: 'error' as const, error: errorMessage },
                    ]);
                    callbacks.current.onError?.(errorMessage);
                    return;
                }

                const newUpload: MediaUpload = {
                    id: uuid,
                    name: file.name,
                    destination,
                    progress: 0,
                    status: 'queued',
                };

                updateUploads((prev) => [...prev, newUpload]);

                queue.current.add(async () => {
                    if (!mounted.current) return;
                    const controller = new AbortController();
                    controllers.current.add(controller);
                    updateUploads((prev) => prev.map((u) => (u.id === uuid ? { ...u, status: 'uploading' } : u)));

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('disk', container || 'public');
                    formData.append('path', destination);

                    try {
                        const response = await axios.post(route('media.create'), formData, {
                            headers: { Accept: 'application/json' },
                            timeout: 120_000,
                            signal: controller.signal,
                            onUploadProgress: (progressEvent) => {
                                if (progressEvent.total) {
                                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                    updateUploads((prev) => prev.map((u) => (u.id === uuid ? { ...u, progress } : u)));
                                }
                            },
                        });

                        if (response.status === 200 || response.status === 201) {
                            const uploadedMedia = confirmedUpload(response.data, destination) as MediaAsset;
                            if (!mounted.current) return;

                            // Mark upload as completed but keep it visible for a moment
                            updateUploads((prev) => prev.map((u) => (u.id === uuid ? { ...u, status: 'completed' as const, progress: 100 } : u)));

                            try {
                                callbacks.current.onUploadComplete?.(
                                    uploadedMedia,
                                    uploadsRef.current.filter((u) => u.id !== uuid),
                                );
                            } catch (error) {
                                // A UI refresh failure must not change a confirmed upload into a failed upload.
                                console.error('Could not refresh the uploaded file', error);
                            }

                            // Remove the upload after showing success for 4 seconds
                            const timer = setTimeout(() => {
                                updateUploads((prev) => prev.filter((u) => u.id !== uuid));
                                timers.current.delete(timer);
                            }, 4000);
                            timers.current.add(timer);
                        } else {
                            throw new Error('The server did not confirm this upload. Refresh the folder before retrying.');
                        }
                    } catch (error: unknown) {
                        if (!mounted.current || axios.isCancel(error)) return;
                        const errorMessage = uploadErrorMessage(error, file);
                        const unconfirmed = errorMessage.includes('did not confirm');

                        updateUploads((prev) =>
                            prev.map((u) => (u.id === uuid ? { ...u, status: 'error' as const, error: errorMessage, unconfirmed } : u)),
                        );
                        callbacks.current.onError?.(errorMessage);
                    } finally {
                        controllers.current.delete(controller);
                    }
                });
            },
            [container, path, updateUploads],
        );

        const selectFile = useCallback(
            (event: React.ChangeEvent<HTMLInputElement>) => {
                Array.from(event.target.files ?? []).forEach(upload);
                event.target.value = '';
            },
            [upload],
        );

        const clear = useCallback(
            (uploadId: string) => {
                updateUploads((prev) => prev.filter((upload) => upload.id !== uploadId || ['queued', 'uploading'].includes(upload.status)));
            },
            [updateUploads],
        );

        const clearAll = useCallback(() => {
            updateUploads((prev) => prev.filter((upload) => ['queued', 'uploading'].includes(upload.status)));
        }, [updateUploads]);

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
