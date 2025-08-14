// File utility functions converted from Vue mixins

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const getFileName = (filename: string, hideExtension: boolean = false): string => {
    if (hideExtension) {
        return filename.replace(/\.[^/.]+$/, '');
    }
    return filename;
};

export const getFileType = (file: { type?: string; name: string }): string => {
    if (file.type === 'folder') return 'folder';

    const mimeType = file.type || '';
    const extension = getFileExtension(file.name).toLowerCase();

    // Image types
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return 'image';
    }

    // Video types
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
        return 'video';
    }

    // Audio types
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
        return 'audio';
    }

    // Document types
    if (mimeType.includes('pdf') || extension === 'pdf') {
        return 'pdf';
    }

    // Text types
    if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
        return 'text';
    }

    // Archive types
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return 'compressed';
    }

    // Application types
    if (mimeType.startsWith('application/')) {
        return 'application';
    }

    return 'file';
};

export const isFileType = (file: { type?: string; name: string }, type: string): boolean => {
    return getFileType(file) === type;
};

export const sortFiles = (files: any[], sortBy: string, direction: 'asc' | 'desc' = 'asc') => {
    return [...files].sort((a, b) => {
        // Always put folders first
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;

        let aValue: any;
        let bValue: any;

        switch (sortBy) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'size':
                aValue = a.size || 0;
                bValue = b.size || 0;
                break;
            case 'modified':
                aValue = new Date(a.last_modified || 0);
                bValue = new Date(b.last_modified || 0);
                break;
            case 'type':
                aValue = getFileType(a);
                bValue = getFileType(b);
                break;
            default:
                aValue = a[sortBy];
                bValue = b[sortBy];
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

export const filterFiles = (files: any[], searchTerm: string, filterType?: string) => {
    return files.filter((file) => {
        const matchesSearch = !searchTerm || file.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = !filterType || filterType === 'all' || getFileType(file) === filterType;

        return matchesSearch && matchesType;
    });
};

export const generatePreviewUrl = (file: { path: string; type?: string; name: string }): string => {
    if (isFileType(file, 'image')) {
        return file.path;
    }

    // Return a placeholder or icon URL for non-image files
    return '/images/file-placeholder.png';
};

export const canEditFile = (file: { type?: string; name: string }): boolean => {
    return isFileType(file, 'image') && !file.name.toLowerCase().includes('.gif');
};

export const getFileMimeTypes = (): Record<string, string[]> => {
    return {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
        video: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        text: ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'],
        archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    };
};

export const isValidFileType = (file: File, allowedTypes?: string[]): boolean => {
    if (!allowedTypes || allowedTypes.length === 0) return true;

    const mimeTypes = getFileMimeTypes();
    const allowedMimeTypes = allowedTypes.flatMap((type) => mimeTypes[type] || [type]);

    return allowedMimeTypes.some((type) => file.type === type || file.type.startsWith(type.split('/')[0] + '/'));
};

export const formatLastModified = (dateString: string): string => {
    const date = new Date(dateString);
    return (
        date.toLocaleDateString() +
        ' ' +
        date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
    );
};
