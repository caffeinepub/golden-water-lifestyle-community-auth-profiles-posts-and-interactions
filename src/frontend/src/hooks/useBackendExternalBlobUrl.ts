import { useEffect, useState } from 'react';
import type { ExternalBlob } from '../backend';

/**
 * Hook that converts backend ExternalBlob to a browser-safe URL for rendering
 * Prefers direct URL when available, falls back to bytes+objectURL
 * Manages cleanup lifecycle to prevent memory leaks
 */
export function useBackendExternalBlobUrl(blob: ExternalBlob | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }

    // Prefer direct URL for streaming and caching
    try {
      const directUrl = blob.getDirectURL();
      if (directUrl) {
        setUrl(directUrl);
        return;
      }
    } catch (error) {
      console.warn('Failed to get direct URL, falling back to bytes:', error);
    }

    // Fallback to bytes + object URL
    let objectUrl: string | null = null;
    blob.getBytes().then((bytes) => {
      const blobObj = new Blob([bytes], { type: 'video/mp4' }); // Default to mp4
      objectUrl = URL.createObjectURL(blobObj);
      setUrl(objectUrl);
    }).catch((error) => {
      console.error('Failed to get blob bytes:', error);
      setUrl(null);
    });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [blob]);

  return url;
}
