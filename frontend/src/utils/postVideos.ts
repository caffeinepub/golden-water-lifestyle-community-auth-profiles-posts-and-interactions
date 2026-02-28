import { ExternalBlob } from '../backend';

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov files
];

// Align with backend limit - using 50MB as a reasonable video size limit
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a video file for upload
 */
export function validateVideoFile(file: File): VideoValidationResult {
  if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported video type. Please use MP4, WebM, OGG, or MOV.',
    };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: 'Video size exceeds maximum allowed limit of 50MB.',
    };
  }

  return { valid: true };
}

/**
 * Converts a File to the backend ExternalBlob format
 */
export async function fileToBackendVideo(file: File): Promise<ExternalBlob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      resolve(ExternalBlob.fromBytes(uint8Array));
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read video file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates a preview URL from a video File object
 */
export function createVideoPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a video blob URL to free memory
 */
export function revokeVideoUrl(url: string): void {
  URL.revokeObjectURL(url);
}
