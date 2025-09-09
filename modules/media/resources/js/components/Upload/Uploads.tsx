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
    <div className="asset-upload-listing bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="asset-upload-listing-header bg-gray-50 px-4 py-2 border-b">
        <h6 className="font-semibold text-gray-900">Upload</h6>
      </div>
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
