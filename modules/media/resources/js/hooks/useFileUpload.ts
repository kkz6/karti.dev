import { useCallback, useState } from 'react';

interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

interface UseFileUploadProps {
    uploadUrl: string;
    onSuccess?: (files: any[]) => void;
    onError?: (error: any) => void;
    onProgress?: (progress: UploadProgress) => void;
}

export const useFileUpload = ({ uploadUrl, onSuccess, onError, onProgress }: UseFileUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const uploadFiles = useCallback(
        async (files: FileList, path: string = '/') => {
            if (!files.length) return;

            setIsUploading(true);
            setUploadProgress(0);

            try {
                const formData = new FormData();
                formData.append('upload_path', path);

                Array.from(files).forEach((file) => {
                    formData.append('files[]', file);
                });

                // Get CSRF token
                const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': csrfToken || '',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    // TODO: Add progress tracking using XMLHttpRequest
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                const result = await response.json();
                onSuccess?.(result);
                setUploadProgress(100);
            } catch (error) {
                console.error('Upload error:', error);
                onError?.(error);
            } finally {
                setIsUploading(false);
            }
        },
        [uploadUrl, onSuccess, onError],
    );

    const uploadFromUrl = useCallback(
        async (url: string, path: string = '/') => {
            setIsUploading(true);

            try {
                const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        url,
                        path,
                        random_names: false,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                const result = await response.json();
                onSuccess?.(result);
            } catch (error) {
                console.error('URL upload error:', error);
                onError?.(error);
            } finally {
                setIsUploading(false);
            }
        },
        [uploadUrl, onSuccess, onError],
    );

    return {
        isUploading,
        uploadProgress,
        uploadFiles,
        uploadFromUrl,
    };
};
