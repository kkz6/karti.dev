import { MediaService } from '@media/services/MediaService';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Custom image upload handler that uses the MediaService
 * @param file The file to upload
 * @param onProgress Optional callback for tracking upload progress
 * @param abortSignal Optional AbortSignal for cancelling the upload
 * @returns Promise resolving to the URL of the uploaded image
 */
export const handleMediaImageUpload = async (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`
    );
  }

  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  try {
    const mediaService = new MediaService();
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('disk', 'public');
    formData.append('path', 'blog/content-images');

    // Simulate progress for the start
    onProgress?.({ progress: 10 });

    // Check for abort signal
    if (abortSignal?.aborted) {
      throw new Error('Upload cancelled');
    }

    // Upload using MediaService (we'll need to adapt this to work with progress)
    const uploadResponse = await mediaService.uploadFiles(
      (() => {
        const fileList = new DataTransfer();
        fileList.items.add(file);
        return fileList.files;
      })(),
      'blog/content-images',
      'public'
    );

    // Simulate progress completion
    onProgress?.({ progress: 100 });

    // Check for abort signal again
    if (abortSignal?.aborted) {
      throw new Error('Upload cancelled');
    }

    // Extract URL from response
    if (uploadResponse && uploadResponse.length > 0) {
      const uploadedFile = uploadResponse[0];
      if (uploadedFile && uploadedFile.url) {
        return uploadedFile.url;
      }
    }

    throw new Error('Upload failed: No URL returned');
  } catch (error) {
    if (abortSignal?.aborted) {
      throw new Error('Upload cancelled');
    }
    
    console.error('Image upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
};
