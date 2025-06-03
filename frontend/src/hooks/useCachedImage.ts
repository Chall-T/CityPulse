import { useState, useEffect } from "react";

type ImageStatus = "loading" | "loaded" | "error";

const CACHE_PREFIX = "image-cache-";
const TIMESTAMP_PREFIX = "image-cache-time-";

const useCachedImage = (
  key: string,
  url: string,
  maxCacheTimeMs: number // cache time amount (e.g., 24h = 24 * 60 * 60 * 1000)
): { imgSrc: string | null; status: ImageStatus } => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<ImageStatus>("loading");

  useEffect(() => {
    const fullKey = CACHE_PREFIX + key;
    const timeKey = TIMESTAMP_PREFIX + key;

    const cached = localStorage.getItem(fullKey);
    const cachedTime = localStorage.getItem(timeKey);

    const now = Date.now();

    // Check if cache is still valid
    if (cached && cachedTime && now - Number(cachedTime) < maxCacheTimeMs) {
      setImgSrc(cached);
      setStatus("loaded");
    } else {
      const fetchImage = async () => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const reader = new FileReader();

          reader.onloadend = () => {
            const base64Data = reader.result as string;
            localStorage.setItem(fullKey, base64Data);
            localStorage.setItem(timeKey, now.toString());
            setImgSrc(base64Data);
            setStatus("loaded");
          };

          reader.onerror = () => {
            setStatus("error");
          };

          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Image fetch error:", err);
          setStatus("error");
        }
      };

      fetchImage();
    }
  }, [key, url, maxCacheTimeMs]);

  return { imgSrc, status };
};

export default useCachedImage;
