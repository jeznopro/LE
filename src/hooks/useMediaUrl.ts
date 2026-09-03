import { useState, useEffect } from 'react';
import { getMediaBlob } from '../utils/mediaStore';

export const useMediaUrl = (filename?: string) => {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!filename) {
      setUrl(undefined);
      return;
    }

    const trimmed = filename.trim();

    // 1. Direct Web URLs, Data URLs, or absolute/relative web paths
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./')
    ) {
      setUrl(trimmed);
      return;
    }

    // 2. Local media files extracted from Anki .apkg (stored in IndexedDB)
    let isMounted = true;
    let objectUrl: string | undefined;

    const loadMedia = async () => {
      try {
        const blob = await getMediaBlob(trimmed);
        if (blob && isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        } else if (isMounted) {
          setUrl(undefined);
        }
      } catch (err) {
        console.error('Failed to load media:', err);
        if (isMounted) setUrl(undefined);
      }
    };

    loadMedia();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [filename]);

  return url;
};
