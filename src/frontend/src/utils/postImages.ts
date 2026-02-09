import type { Image } from '../backend';

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB to match backend limit

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file for upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported image type. Please use JPEG, PNG, WebP, or GIF.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: 'Image size exceeds maximum allowed limit of 10MB.',
    };
  }

  return { valid: true };
}

/**
 * Converts a File to the backend Image format (Uint8Array + mimeType)
 */
export async function fileToBackendImage(file: File): Promise<Image> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      resolve({
        data: uint8Array,
        mimeType: file.type,
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Safely unwraps an optional image from the backend response
 * Handles various possible encodings (undefined, null, empty array, wrapped value)
 */
export function unwrapOptionalImage(image: Image | undefined | null): Image | undefined {
  if (!image) return undefined;
  if (typeof image === 'object' && 'data' in image && 'mimeType' in image) {
    return image;
  }
  return undefined;
}

/**
 * Converts backend image data to a browser-safe blob URL for rendering
 */
export function backendImageToUrl(image: Image): string {
  const blob = new Blob([new Uint8Array(image.data)], { type: image.mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Creates a preview URL from a File object
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a blob URL to free memory
 */
export function revokeImageUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Extracts a user-friendly error message from backend errors
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) {
    const message = error.message;
    if (message.includes('trap')) {
      const trapMatch = message.match(/trap[^:]*:\s*(.+?)(?:\n|$)/i);
      if (trapMatch) return trapMatch[1].trim();
    }
    return message;
  }
  return 'An unexpected error occurred. Please try again.';
}
