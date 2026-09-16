import React from 'react';
import { Upload } from './Upload';
import { MediaUpload } from '../../types/media';

interface UploadsProps {
  uploads: MediaUpload[];
  onClearUpload?: (uploadId: string) => void;
}

export const Uploads: React.FC<UploadsProps> = ({ uploads, onClearUpload }) => {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className="asset-upload-listing border-border border-y bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {uploads.map((upload) => (
              <Upload
                key={upload.id}
                basename={upload.name}
                extension={upload.name.split('.').pop() || ''}
                percent={upload.progress}
                error={upload.error}
                onClear={() => onClearUpload?.(upload.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
