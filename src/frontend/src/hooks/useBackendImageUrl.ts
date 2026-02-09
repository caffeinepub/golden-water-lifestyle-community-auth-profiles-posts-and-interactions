import { useEffect, useState } from 'react';
import type { Image } from '../backend';
import { backendImageToUrl, revokeImageUrl } from '../utils/postImages';

/**
 * Hook that converts backend Image to a blob URL and manages cleanup
 * Prevents memory leaks by revoking URLs on unmount or when image changes
 */
export function useBackendImageUrl(image: Image | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image || !image.data || image.data.length === 0) {
      setUrl(null);
      return;
    }

    const blobUrl = backendImageToUrl(image);
    setUrl(blobUrl);

    return () => {
      revokeImageUrl(blobUrl);
    };
  }, [image]);

  return url;
}
