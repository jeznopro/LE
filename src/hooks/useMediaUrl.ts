import { useState, useEffect } from 'react';
import { getMediaBlob } from '../utils/mediaStore';

export const useMediaUrl = (filename?: string) => {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!filename) {
      setUrl(undefined);
      return;
    }

    let isMounted = true;
    let objectUrl: string | undefined;

    const loadMedia = async () => {
      try {
        const blob = await getMediaBlob(filename);
        if (blob && isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      } catch (err) {
        console.error('Failed to load media:', err);
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
