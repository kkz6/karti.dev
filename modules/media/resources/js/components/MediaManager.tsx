import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { Separator } from '@shared/components/ui/separator';
import { cn } from '@shared/lib/utils';
import {
    Download,
    Edit,
    File,
    FileText,
    Folder,
    FolderPlus,
    Grid3X3,
    Image,
    MoreHorizontal,
    Music,
    RefreshCw,
    Search,
    Share,
    Terminal,
    Trash2,
    Upload,
    Video,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { mediaService, type MediaConfig, type MediaRoutes, type MediaConfigResponse } from '@media/services/MediaService';

// Types - Updated to match API response
interface MediaFile {
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

interface MediaFolder {
    name: string;
    timestamp: string | 'N/A';
}

interface MediaApiResponse {
    subdirectories: MediaFolder[];
    media: MediaFile[];
    page_count: number;
}

interface MediaManagerProps {
    inModal?: boolean;
}

// Custom hooks to replace Vue mixins
const useMediaManager = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [currentPath, setCurrentPath] = useState('/');
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
    const [searchFor, setSearchFor] = useState('');
    const [filterName, setFilterName] = useState<string | null>(null);
    const [sortName, setSortName] = useState<string | null>(null);
    const [bulkSelect, setBulkSelect] = useState(false);
    const [bulkList, setBulkList] = useState<MediaFile[]>([]);
    const [movableList, setMovableList] = useState<MediaFile[]>([]);
    const [infoSidebar, setInfoSidebar] = useState(false);
    const [uploadArea, setUploadArea] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [progressCounter, setProgressCounter] = useState(0);
    const [pageCount, setPageCount] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [config, setConfig] = useState<MediaConfig | null>(null);
    const [routes, setRoutes] = useState<MediaRoutes | null>(null);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    // Load configuration from API
    const loadConfig = useCallback(async () => {
        setConfigLoading(true);
        try {
            const response = await mediaService.getConfig();
            setConfig(response.config);
            setRoutes(response.routes);
            setTranslations(response.translations);
        } catch (error) {
            console.error('Error loading configuration:', error);
        } finally {
            setConfigLoading(false);
        }
    }, []);

    // File operations
    const getFiles = useCallback(async (path?: string, page?: number) => {
        setIsLoading(true);
        try {
            const response = await mediaService.getFiles({
                path: path || currentPath,
                page: page || currentPage,
                disk: 'public' // Default disk
            });
            
            setFiles(response.media);
            setFolders(response.subdirectories);
            setPageCount(response.page_count);
            if (path) {
                setCurrentPath(path);
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            // You might want to show a toast or error message here
        } finally {
            setIsLoading(false);
        }
    }, [currentPath, currentPage]);

    const uploadFiles = useCallback(async (fileList: FileList) => {
        setShowProgress(true);
        setProgressCounter(0);

        try {
            await mediaService.uploadFiles(fileList, currentPath, 'public');
            // Refresh the file list after upload
            await getFiles();
            setProgressCounter(100);
        } catch (error) {
            console.error('Error uploading files:', error);
            // You might want to show a toast or error message here
        } finally {
            setShowProgress(false);
        }
    }, [currentPath, getFiles]);

    return {
        isLoading,
        configLoading,
        files,
        folders,
        currentPath,
        setCurrentPath,
        selectedFile,
        setSelectedFile,
        searchFor,
        setSearchFor,
        filterName,
        setFilterName,
        sortName,
        setSortName,
        bulkSelect,
        setBulkSelect,
        bulkList,
        setBulkList,
        movableList,
        setMovableList,
        infoSidebar,
        setInfoSidebar,
        uploadArea,
        setUploadArea,
        showProgress,
        progressCounter,
        pageCount,
        currentPage,
        setCurrentPage,
        config,
        routes,
        translations,
        loadConfig,
        getFiles,
        uploadFiles,
    };
};

// File type icons
const getFileIcon = (file: MediaFile) => {
    if (file.mime_type.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (file.mime_type.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (file.mime_type.startsWith('audio/')) return <Music className="h-6 w-6" />;
    if (file.mime_type.includes('text') || file.mime_type.includes('json')) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
};

// Folder icon component
const getFolderIcon = () => <Folder className="h-6 w-6" />;

// File size formatter
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const MediaManager: React.FC<MediaManagerProps> = ({
    inModal = false,
}) => {
    const {
        isLoading,
        configLoading,
        files,
        folders,
        currentPath,
        setCurrentPath,
        selectedFile,
        setSelectedFile,
        searchFor,
        setSearchFor,
        filterName,
        setFilterName,
        sortName,
        setSortName,
        bulkSelect,
        setBulkSelect,
        bulkList,
        setBulkList,
        movableList,
        setMovableList,
        infoSidebar,
        setInfoSidebar,
        uploadArea,
        setUploadArea,
        showProgress,
        progressCounter,
        pageCount,
        currentPage,
        setCurrentPage,
        config,
        routes,
        translations,
        loadConfig,
        getFiles,
        uploadFiles,
    } = useMediaManager();

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    useEffect(() => {
        if (config && !configLoading) {
            getFiles();
        }
    }, [config, configLoading, getFiles]);

    // Handle file selection
    const handleFileSelect = (file: MediaFile) => {
        if (bulkSelect) {
            setBulkList((prev) => (prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]));
        } else {
            setSelectedFile(file);
        }
    };

    // Handle file upload
    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            uploadFiles(files);
        }
    };

    // Filtered and sorted files
    const filteredFiles = files.filter((file) => !searchFor || file.basename.toLowerCase().includes(searchFor.toLowerCase()));
    
    // Combined items (folders + files) for display
    const allItems = [
        ...folders.map(folder => ({ 
            ...folder, 
            type: 'folder' as const,
            id: `folder-${folder.name}`,
            basename: folder.name
        })),
        ...filteredFiles.map(file => ({ 
            ...file, 
            type: 'file' as const 
        }))
    ];

    // Show loading state while configuration is being loaded
    if (configLoading || !config || !routes || !translations) {
        return (
            <div className={cn('media-manager bg-background flex flex-col h-full max-h-full items-center justify-center', { 'rounded-lg border': !inModal })}>
                <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading media manager...</p>
            </div>
        );
    }

    return (
        <div className={cn('media-manager bg-background flex flex-col h-full max-h-full', { 'rounded-lg border': !inModal })}>
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b p-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {/* Upload button */}
                    <Button onClick={handleFileUpload} disabled={isLoading} className="gap-2">
                        <Upload className="h-4 w-4" />
                        {translations.upload || 'Upload'}
                    </Button>

                    {/* New folder */}
                    <Button variant="outline" disabled={isLoading} className="gap-2">
                        <FolderPlus className="h-4 w-4" />
                        {translations.new_folder || 'New Folder'}
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    {/* File operations */}
                    <Button variant="outline" disabled={!selectedFile || isLoading} className="gap-2">
                        <Share className="h-4 w-4" />
                        {translations.move || 'Move'}
                    </Button>

                    <Button variant="outline" disabled={!selectedFile || isLoading} className="gap-2">
                        <Terminal className="h-4 w-4" />
                        {translations.rename || 'Rename'}
                    </Button>

                    <Button variant="outline" disabled={!selectedFile || isLoading || selectedFile?.mime_type.includes('gif')} className="gap-2">
                        <Edit className="h-4 w-4" />
                        {translations.edit || 'Edit'}
                    </Button>

                    <Button variant="destructive" disabled={!selectedFile || isLoading} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        {translations.delete || 'Delete'}
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                        <Input
                            type="text"
                            placeholder={translations.search || 'Search files...'}
                            value={searchFor}
                            onChange={(e) => setSearchFor(e.target.value)}
                            className="w-full sm:w-64 pl-10"
                        />
                        {searchFor && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0"
                                onClick={() => setSearchFor('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Bulk select */}
                    <Button
                        variant={bulkSelect ? 'default' : 'outline'}
                        onClick={() => setBulkSelect(!bulkSelect)}
                        disabled={!files.length || isLoading}
                    >
                        {bulkSelect ? (translations.cancel || 'Cancel') : (translations.bulk_select || 'Bulk Select')}
                    </Button>

                    {/* View toggle */}
                    <Button variant="outline" size="sm">
                        <Grid3X3 className="h-4 w-4" />
                    </Button>

                    {/* Refresh */}
                    <Button variant="outline" onClick={() => getFiles()} disabled={isLoading}>
                        <RefreshCw className={cn('h-4 w-4', { 'animate-spin': isLoading })} />
                    </Button>

                    {/* Info sidebar toggle */}
                    <Button variant="outline" onClick={() => setInfoSidebar(!infoSidebar)} disabled={!files.length}>
                        {infoSidebar ? (translations.hide_info || 'Hide Info') : (translations.show_info || 'Show Info')}
                    </Button>
                </div>
            </div>

            {/* Progress bar */}
            {showProgress && (
                <div className="mx-4 my-2 h-2 w-full rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progressCounter}%` }}></div>
                </div>
            )}

            {/* Main content area */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Files grid/list */}
                <div className="flex-1 overflow-auto">
                    <ScrollArea className="h-full">
                        <div className="p-6">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
                        </div>
                    ) : allItems.length === 0 ? (
                        <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
                            <Folder className="mb-4 h-16 w-16" />
                            <p className="text-lg">{translations.no_files_found || 'No files found'}</p>
                            {searchFor && (
                                <Button variant="outline" onClick={() => setSearchFor('')} className="mt-2">
                                    Clear search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {allItems.map((item) => (
                                <Card
                                    key={item.type === 'folder' ? `folder-${item.name}` : `file-${item.id}`}
                                    className={cn('cursor-pointer transition-all hover:shadow-md', {
                                        'ring-primary ring-2': selectedFile === item && !bulkSelect && item.type === 'file',
                                        'ring-2 ring-blue-500': item.type === 'file' && bulkList.includes(item as MediaFile),
                                    })}
                                    onClick={() => item.type === 'file' && handleFileSelect(item as MediaFile)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="text-muted-foreground mb-2">
                                                {item.type === 'folder' ? (
                                                    getFolderIcon()
                                                ) : item.mime_type.startsWith('image/') ? (
                                                    <img src={item.url} alt={item.basename} className="h-12 w-12 rounded object-cover" />
                                                ) : (
                                                    getFileIcon(item as MediaFile)
                                                )}
                                            </div>
                                            <p className="w-full truncate text-sm font-medium" title={item.basename}>
                                                {item.basename}
                                            </p>
                                            {item.type === 'file' && <p className="text-muted-foreground text-xs">{formatFileSize(item.size)}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Info sidebar */}
                {infoSidebar && (
                    <div className="bg-muted/10 w-80 border-l flex-shrink-0">
                        <ScrollArea className="h-full">
                            <div className="p-4">
                            {selectedFile ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        {selectedFile.mime_type.startsWith('image/') ? (
                                            <img src={selectedFile.url} alt={selectedFile.basename} className="mx-auto w-full max-w-48 rounded-lg" />
                                        ) : (
                                            <div className="text-muted-foreground mx-auto flex h-24 w-24 items-center justify-center">
                                                {getFileIcon(selectedFile)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-sm font-medium">Name:</label>
                                            <p className="text-muted-foreground text-sm">{selectedFile.basename}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Type:</label>
                                            <p className="text-muted-foreground text-sm">{selectedFile.mime_type}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Size:</label>
                                            <p className="text-muted-foreground text-sm">{formatFileSize(selectedFile.size)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Created:</label>
                                            <p className="text-muted-foreground text-sm">{new Date(selectedFile.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Modified:</label>
                                            <p className="text-muted-foreground text-sm">{new Date(selectedFile.updated_at).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Directory:</label>
                                            <p className="text-muted-foreground text-sm">{selectedFile.directory || '/'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="flex-1">
                                            <Download className="mr-2 h-4 w-4" />
                                            {translations.download || 'Download'}
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-center">
                                    <p>Select a file to view details</p>
                                </div>
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="bg-muted/5 flex items-center justify-between border-t px-4 py-2 flex-shrink-0">
                <div className="text-muted-foreground text-sm">
                    {allItems.length} items ({folders.length} folders, {filteredFiles.length} files)
                    {bulkList.length > 0 && ` • ${bulkList.length} selected`}
                </div>
                <div className="text-muted-foreground text-sm">{currentPath}</div>
            </div>
        </div>
    );
};

export default MediaManager;
