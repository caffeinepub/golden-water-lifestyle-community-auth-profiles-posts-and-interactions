import { useEffect, useState } from 'react';
import type { ExternalBlob } from '../backend';

/**
 * Hook that converts backend ExternalBlob (image) to a blob URL and manages cleanup
 * Prevents memory leaks by revoking URLs on unmount or when image changes
 */
export function useBackendImageUrl(image: ExternalBlob | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setUrl(null);
      return;
    }

    try {
      // Prefer direct URL for streaming and caching
      const directUrl = image.getDirectURL();
      if (directUrl) {
        setUrl(directUrl);
        return;
      }
    } catch (error) {
      console.warn('Failed to get direct URL for image:', error);
    }

    // Fallback to bytes + object URL
    let objectUrl: string | null = null;
    image.getBytes().then((bytes) => {
      const blob = new Blob([bytes], { type: 'image/jpeg' }); // Default type
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch((error) => {
      console.error('Failed to get image bytes:', error);
      setUrl(null);
    });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [image]);

  return url;
}
