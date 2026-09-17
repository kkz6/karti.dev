import { MediaAsset, MediaUpload } from './media';

export interface AssetFieldConfig {
    folder?: string;
    max_files?: number;
    restrict?: boolean;
    mode?: 'grid' | 'list';
    canEdit?: boolean;
    accept?: string; // File type restrictions
    maxFileSize?: number; // In bytes
}

export type AssetUpload = MediaUpload;

export type DisplayMode = 'grid' | 'list';

export interface AssetFieldProps {
    name: string;
    data: (MediaAsset | string | number | { id: string | number })[];
    config: AssetFieldConfig;
    required?: boolean;
    readOnly?: boolean;
    onChange: (assets: (MediaAsset | string)[]) => void;
    onError?: (error: string) => void;
}
