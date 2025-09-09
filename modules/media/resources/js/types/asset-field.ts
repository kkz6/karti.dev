import { MediaAsset } from './media';

export interface AssetFieldConfig {
    container?: string;
    folder?: string;
    max_files?: number;
    restrict?: boolean;
    mode?: 'grid' | 'list';
    canEdit?: boolean;
    accept?: string; // File type restrictions
    maxFileSize?: number; // In bytes
}

export interface AssetUpload {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'complete' | 'completed' | 'error';
    error?: string;
}

export type DisplayMode = 'grid' | 'list';

export interface AssetFieldProps {
    name: string;
    data: MediaAsset[];
    config: AssetFieldConfig;
    required?: boolean;
    readOnly?: boolean;
    onChange: (assets: MediaAsset[]) => void;
    onError?: (error: string) => void;
}
