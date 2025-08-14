import React, { useState } from 'react';
import { Upload } from './Upload';
import { MediaUpload } from '../types/media';

interface UploadsProps {
  uploads: MediaUpload[];
}

export const Uploads: React.FC<UploadsProps> = ({ uploads: initialUploads }) => {
  const [uploads, setUploads] = useState<MediaUpload[]>(initialUploads);

  const clearUpload = (index: number) => {
    setUploads(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

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
            {uploads.map((upload, index) => (
              <Upload
                key={upload.id}
                basename={upload.name}
                extension={upload.name.split('.').pop() || ''}
                percent={upload.progress}
                error={upload.error}
                onClear={() => clearUpload(index)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
