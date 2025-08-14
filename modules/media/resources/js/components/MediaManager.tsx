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

// Types
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

interface MediaManagerConfig {
    baseUrl: string;
    hideFilesExt: boolean;
    mimeTypes: Record<string, string[]>;
    broadcasting: boolean;
    gfi: boolean;
    ratioBar: boolean;
    previewFilesBeforeUpload: boolean;
}

interface MediaManagerRoutes {
    files: string;
    lock: string;
    visibility: string;
    upload: string;
    locked_list: string;
}

interface MediaManagerProps {
    config: MediaManagerConfig;
    routes: MediaManagerRoutes;
    inModal?: boolean;
    translations: Record<string, string>;
    uploadPanelImgList?: string[];
    hideExt?: string[];
    hidePath?: string[];
    restrict?: Record<string, any>;
    userId?: number;
}

// Custom hooks to replace Vue mixins
const useMediaManager = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<{ items: MediaFile[]; path: string }>({ items: [], path: '/' });
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
    const [folders, setFolders] = useState<string[]>([]);
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

    // File operations
    const getFiles = useCallback(async (path?: string[], selectedFileName?: string) => {
        setIsLoading(true);
        try {
            // This would be replaced with actual API call
            // const response = await fetch(routes.files)
            // const data = await response.json()
            // setFiles(data)
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const uploadFiles = useCallback(async (fileList: FileList) => {
        setShowProgress(true);
        setProgressCounter(0);

        try {
            // Implementation for file upload
            // This would use the upload route and handle progress
        } catch (error) {
            console.error('Error uploading files:', error);
        } finally {
            setShowProgress(false);
        }
    }, []);

    return {
        isLoading,
        files,
        selectedFile,
        setSelectedFile,
        folders,
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
        getFiles,
        uploadFiles,
    };
};

// File type icons
const getFileIcon = (file: MediaFile) => {
    if (file.type === 'folder') return <Folder className="h-6 w-6" />;
    if (file.type.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (file.type.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (file.type.startsWith('audio/')) return <Music className="h-6 w-6" />;
    if (file.type.includes('text') || file.type.includes('json')) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
};

// File size formatter
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const MediaManager: React.FC<MediaManagerProps> = ({
    config,
    routes,
    inModal = false,
    translations,
    uploadPanelImgList = [],
    hideExt = [],
    hidePath = [],
    restrict = {},
    userId = 0,
}) => {
    const {
        isLoading,
        files,
        selectedFile,
        setSelectedFile,
        folders,
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
        getFiles,
        uploadFiles,
    } = useMediaManager();

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getFiles();
    }, [getFiles]);

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
    const filteredFiles = files.items.filter((file) => !searchFor || file.name.toLowerCase().includes(searchFor.toLowerCase()));

    return (
        <div className={cn('media-manager bg-background flex h-full flex-col', { 'rounded-lg border': !inModal })}>
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

            {/* Toolbar */}
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                    {/* Upload button */}
                    <Button onClick={handleFileUpload} disabled={isLoading} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                    </Button>

                    {/* New folder */}
                    <Button variant="outline" disabled={isLoading} className="gap-2">
                        <FolderPlus className="h-4 w-4" />
                        New Folder
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    {/* File operations */}
                    <Button variant="outline" disabled={!selectedFile || isLoading} className="gap-2">
                        <Share className="h-4 w-4" />
                        Move
                    </Button>

                    <Button variant="outline" disabled={!selectedFile || isLoading} className="gap-2">
                        <Terminal className="h-4 w-4" />
                        Rename
                    </Button>

                    <Button variant="outline" disabled={!selectedFile || isLoading || selectedFile?.type.includes('gif')} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>

                    <Button variant="destructive" disabled={!selectedFile || isLoading} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                        <Input
                            type="text"
                            placeholder="Search files..."
                            value={searchFor}
                            onChange={(e) => setSearchFor(e.target.value)}
                            className="w-64 pl-10"
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
                        disabled={!files.items.length || isLoading}
                    >
                        {bulkSelect ? 'Cancel' : 'Bulk Select'}
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
                    <Button variant="outline" onClick={() => setInfoSidebar(!infoSidebar)} disabled={!files.items.length}>
                        {infoSidebar ? 'Hide Info' : 'Show Info'}
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
            <div className="flex flex-1 overflow-hidden">
                {/* Files grid/list */}
                <div className="flex-1 p-4">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
                            <Folder className="mb-4 h-16 w-16" />
                            <p className="text-lg">No files found</p>
                            {searchFor && (
                                <Button variant="outline" onClick={() => setSearchFor('')} className="mt-2">
                                    Clear search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {filteredFiles.map((file) => (
                                <Card
                                    key={file.storage_path}
                                    className={cn('cursor-pointer transition-all hover:shadow-md', {
                                        'ring-primary ring-2': selectedFile === file && !bulkSelect,
                                        'ring-2 ring-blue-500': bulkList.includes(file),
                                    })}
                                    onClick={() => handleFileSelect(file)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="text-muted-foreground mb-2">
                                                {file.type.startsWith('image/') ? (
                                                    <img src={file.path} alt={file.name} className="h-12 w-12 rounded object-cover" />
                                                ) : (
                                                    getFileIcon(file)
                                                )}
                                            </div>
                                            <p className="w-full truncate text-sm font-medium" title={file.name}>
                                                {file.name}
                                            </p>
                                            {file.type !== 'folder' && <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info sidebar */}
                {infoSidebar && (
                    <div className="bg-muted/10 w-80 border-l">
                        <ScrollArea className="h-full p-4">
                            {selectedFile ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        {selectedFile.type.startsWith('image/') ? (
                                            <img src={selectedFile.path} alt={selectedFile.name} className="mx-auto w-full max-w-48 rounded-lg" />
                                        ) : (
                                            <div className="text-muted-foreground mx-auto flex h-24 w-24 items-center justify-center">
                                                {getFileIcon(selectedFile)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-sm font-medium">Name:</label>
                                            <p className="text-muted-foreground text-sm">{selectedFile.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Type:</label>
                                            <p className="text-muted-foreground text-sm">{selectedFile.type}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Size:</label>
                                            <p className="text-muted-foreground text-sm">{formatFileSize(selectedFile.size)}</p>
                                        </div>
                                        {selectedFile.last_modified_formated && (
                                            <div>
                                                <label className="text-sm font-medium">Modified:</label>
                                                <p className="text-muted-foreground text-sm">{selectedFile.last_modified_formated}</p>
                                            </div>
                                        )}
                                        {selectedFile.visibility && (
                                            <div>
                                                <label className="text-sm font-medium">Visibility:</label>
                                                <Badge variant="outline">{selectedFile.visibility}</Badge>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="flex-1">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
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
                        </ScrollArea>
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="bg-muted/5 flex items-center justify-between border-t px-4 py-2">
                <div className="text-muted-foreground text-sm">
                    {filteredFiles.length} items
                    {bulkList.length > 0 && ` • ${bulkList.length} selected`}
                </div>
                <div className="text-muted-foreground text-sm">{files.path}</div>
            </div>
        </div>
    );
};

export default MediaManager;
