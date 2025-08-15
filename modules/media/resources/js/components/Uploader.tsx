import React, { useRef, useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import { MediaUpload } from '../types/media';

interface UploaderProps {
  domElement?: HTMLDivElement | null;
  container?: string | null;
  path?: string | null;
  onProgress?: (upload: MediaUpload) => void;
  onUploadComplete?: (item: any, uploads: MediaUpload[]) => void;
  onError?: (error: string) => void;
  onUpdated?: (uploads: MediaUpload[]) => void;
}

export interface UploaderRef {
  browse: () => void;
  upload: (file: File) => void;
}

export const Uploader = React.forwardRef<UploaderRef, UploaderProps>(({
  domElement = null,
  container = null,
  path = null,
  onProgress,
  onUploadComplete,
  onError,
  onUpdated
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<MediaUpload[]>([]);

  const generateId = (): string => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  };

  const browse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const selectFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        upload(file);
      });
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    const uuid = generateId();
    const newUpload: MediaUpload = {
      id: uuid,
      name: file.name,
      progress: 0,
      status: 'uploading',
    };

    setUploads(prev => [...prev, newUpload]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection_name', container || '');
    formData.append('path', path || '');
    formData.append('filename', file.name);
    formData.append('extension', file.name.split('.').pop() || '');

    try {
      const response = await axios.post('/admin/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploads(prev => prev.map(u => 
              u.id === uuid ? { ...u, progress } : u
            ));
          }
        },
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data.success) {
          setUploads(prev => prev.filter(u => u.id !== uuid));
          onUploadComplete?.(response.data.media, uploads.filter(u => u.id !== uuid));
        } else {
          const errorMsg = response.data.message || 'Error on file upload';
          setUploads(prev => prev.map(u => 
            u.id === uuid 
              ? { ...u, status: 'error' as const, error: errorMsg }
              : u
          ));
          onError?.(errorMsg);
        }
      } else {
        setUploads(prev => prev.map(u => 
          u.id === uuid 
            ? { ...u, status: 'error' as const, error: 'Upload failed' }
            : u
        ));
        onError?.('Upload failed');
      }
    } catch (error: any) {
      let errorMessage = 'Network error';
      
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'File size is too large';
        } else {
          errorMessage = error.response.data?.message || 'Upload failed';
        }
      }

      setUploads(prev => prev.map(u => 
        u.id === uuid 
          ? { ...u, status: 'error' as const, error: errorMessage }
          : u
      ));
      onError?.(errorMessage);
    }
  }, [container, path, onUploadComplete, onError, onUpdated]);

  const uploadFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      upload(file);
    });
  }, [upload]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    browse,
    upload,
  }));

  useEffect(() => {
    onUpdated?.(uploads);
  }, [uploads, onUpdated]);

  return (
    <div className="asset-uploader">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={selectFile}
      />
    </div>
  );
});
