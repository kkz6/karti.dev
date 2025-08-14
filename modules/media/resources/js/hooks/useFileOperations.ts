import { useCallback, useState } from 'react';

interface MediaFile {
    name: string;
    storage_path: string;
    path: string;
    type: string;
    size: number;
    last_modified: string;
    last_modified_formated: string;
    visibility?: string;
}

interface UseFileOperationsProps {
    routes: {
        files: string;
        lock: string;
        visibility: string;
        delete?: string;
        rename?: string;
        move?: string;
    };
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
}

export const useFileOperations = ({ routes, onSuccess, onError }: UseFileOperationsProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const makeRequest = async (url: string, options: RequestInit = {}) => {
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }

        return response.json();
    };

    const getFiles = useCallback(
        async (path: string = '/', selectedFile?: string) => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ path });
                if (selectedFile) params.append('selected', selectedFile);

                const data = await makeRequest(`${routes.files}?${params}`);
                return data;
            } catch (error) {
                console.error('Error fetching files:', error);
                onError?.('Failed to load files');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [routes.files, onError],
    );

    const deleteFiles = useCallback(
        async (files: MediaFile[] | MediaFile) => {
            setIsLoading(true);
            try {
                const fileList = Array.isArray(files) ? files : [files];
                const data = await makeRequest(routes.delete || '/media/delete', {
                    method: 'POST',
                    body: JSON.stringify({
                        files: fileList.map((f) => f.storage_path),
                    }),
                });

                onSuccess?.(`Deleted ${fileList.length} file(s)`);
                return data;
            } catch (error) {
                console.error('Error deleting files:', error);
                onError?.('Failed to delete files');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [routes.delete, onSuccess, onError],
    );

    const renameFile = useCallback(
        async (file: MediaFile, newName: string) => {
            setIsLoading(true);
            try {
                const data = await makeRequest(routes.rename || '/media/rename', {
                    method: 'POST',
                    body: JSON.stringify({
                        file: file.storage_path,
                        new_name: newName,
                    }),
                });

                onSuccess?.(`Renamed "${file.name}" to "${newName}"`);
                return data;
            } catch (error) {
                console.error('Error renaming file:', error);
                onError?.('Failed to rename file');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [routes.rename, onSuccess, onError],
    );

    const moveFiles = useCallback(
        async (files: MediaFile[] | MediaFile, targetPath: string) => {
            setIsLoading(true);
            try {
                const fileList = Array.isArray(files) ? files : [files];
                const data = await makeRequest(routes.move || '/media/move', {
                    method: 'POST',
                    body: JSON.stringify({
                        files: fileList.map((f) => f.storage_path),
                        target_path: targetPath,
                    }),
                });

                onSuccess?.(`Moved ${fileList.length} file(s) to ${targetPath}`);
                return data;
            } catch (error) {
                console.error('Error moving files:', error);
                onError?.('Failed to move files');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [routes.move, onSuccess, onError],
    );

    const toggleLock = useCallback(
        async (file: MediaFile) => {
            setIsLoading(true);
            try {
                const data = await makeRequest(routes.lock, {
                    method: 'POST',
                    body: JSON.stringify({
                        file: file.storage_path,
                    }),
                });

                onSuccess?.(`${data.locked ? 'Locked' : 'Unlocked'} "${file.name}"`);
                return data;
            } catch (error) {
                console.error('Error toggling lock:', error);
                onError?.('Failed to toggle file lock');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [routes.lock, onSuccess, onError],
    );

    const toggleVisibility = useCallback(
        async (file: MediaFile) => {
            setIsLoading(true);
            try {
                const data = await makeRequest(routes.visibility, {
                    method: 'POST',
                    body: JSON.stringify({
                        file: file.storage_path,
                    }),
                });

                onSuccess?.(`Changed visibility of "${file.name}"`);
                return data;
            } catch (error) {
                console.error('Error toggling visibility:', error);
                onError?.('Failed to change file visibility');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [routes.visibility, onSuccess, onError],
    );

    const createFolder = useCallback(
        async (name: string, path: string = '/') => {
            setIsLoading(true);
            try {
                const data = await makeRequest('/media/folder', {
                    method: 'POST',
                    body: JSON.stringify({
                        name,
                        path,
                    }),
                });

                onSuccess?.(`Created folder "${name}"`);
                return data;
            } catch (error) {
                console.error('Error creating folder:', error);
                onError?.('Failed to create folder');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [onSuccess, onError],
    );

    return {
        isLoading,
        getFiles,
        deleteFiles,
        renameFile,
        moveFiles,
        toggleLock,
        toggleVisibility,
        createFolder,
    };
};
