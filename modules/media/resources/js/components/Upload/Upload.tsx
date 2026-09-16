import { Button } from '@shared/components/ui/button';
import { AlertCircle, X, CheckCircle } from 'lucide-react';
import React from 'react';
import { FileIcon } from '../Icons/FileIcon';
import { LoadingGraphic } from '../UI/LoadingGraphic';

interface UploadProps {
    extension: string;
    basename: string;
    percent: number;
    error?: string | null;
    onClear: () => void;
}

export const Upload: React.FC<UploadProps> = ({ extension, basename, percent, error, onClear }) => {
    const getStatus = () => {
        if (error) {
            return 'error';
        } else if (percent === 100) {
            return 'completed';
        } else {
            return 'uploading';
        }
    };

    const status = getStatus();

    return (
        <tr className={`upload-row ${status} ${status === 'error' ? 'bg-destructive/5' : 'bg-card'}`}>
            <td className="column-status px-4 py-3">
                {status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                ) : status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                    <LoadingGraphic text="" />
                )}
            </td>

            <td className="column-thumbnail py-3 pr-3">
                <div className="flex h-8 w-8 items-center justify-center">
                    <FileIcon extension={extension} className="h-6 w-6" />
                </div>
            </td>

            <td className="column-filename py-3 pr-4">
                <span className="filename font-medium">{basename}</span>
            </td>

            {status === 'error' ? (
                <td className="column-error py-3 pr-4 text-sm text-destructive">{error}</td>
            ) : status === 'completed' ? (
                <td className="column-progress py-3 pr-4 text-sm font-medium text-green-600">Upload completed successfully</td>
            ) : (
                <td className="column-progress py-3 pr-4">
                    <div className="h-1 w-full bg-muted">
                        <div
                            className="h-1 bg-primary transition-all"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </td>
            )}

            <td className="w-12 px-3 py-3">
                {status === 'error' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={onClear}
                        aria-label={`Dismiss ${basename} upload error`}
                        className="h-8 w-8 rounded-none hover:bg-destructive/10"
                    >
                        <X className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </td>
        </tr>
    );
};
