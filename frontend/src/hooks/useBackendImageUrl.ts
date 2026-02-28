import { useEffect, useState, useRef } from 'react';
import type { ExternalBlob } from '../backend';

/**
 * Custom hook to convert backend ExternalBlob (images) to browser-safe URLs.
 * Prefers direct streaming URLs when available, falls back to bytes+objectURL.
 * Properly manages URL lifecycle to prevent memory leaks.
 */
export function useBackendImageUrl(blob: ExternalBlob | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const blobRefRef = useRef<ExternalBlob | undefined | null>(blob);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    // Track if this effect is still mounted
    let isMounted = true;

    // Clean up previous URL if blob reference changed
    if (blobRefRef.current !== blob && urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      setUrl(null);
    }

    blobRefRef.current = blob;

    if (!blob) {
      setUrl(null);
      return;
    }

    // Try direct URL first (streaming, no memory overhead)
    try {
      const directUrl = blob.getDirectURL();
      if (directUrl && isMounted) {
        setUrl(directUrl);
        urlRef.current = directUrl;
        return;
      }
    } catch (e) {
      // Direct URL not available, fall through to bytes
    }

    // Fall back to bytes + object URL
    blob
      .getBytes()
      .then((bytes) => {
        if (!isMounted) return;
        const blobObj = new Blob([bytes], { type: 'image/jpeg' });
        const objectUrl = URL.createObjectURL(blobObj);
        setUrl(objectUrl);
        urlRef.current = objectUrl;
      })
      .catch((error) => {
        console.error('Failed to load image:', error);
        if (isMounted) {
          setUrl(null);
        }
      });

    return () => {
      isMounted = false;
      // Clean up object URL on unmount
      if (urlRef.current && urlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [blob]);

  return url;
}
