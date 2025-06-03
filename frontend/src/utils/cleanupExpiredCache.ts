import CacheConfig from "../constants/cache"

export const cleanupExpiredCache = (prefix: string, ttl: number) => {
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix) || !key.endsWith("-time")) continue;

    const time = localStorage.getItem(key);
    const cacheTime = time ? parseInt(time, 10) : 0;

    if (now - cacheTime > ttl) {
      const baseKey = key.replace("-time", "");
      localStorage.removeItem(baseKey); // remove cached value
      localStorage.removeItem(key);     // remove time tracker
      console.log(`[Cache] Cleared expired: ${baseKey}`);
    }
  }
};

export const cleanAllExpiredCaches = () => {
  Object.values(CacheConfig).forEach(({ prefix, ttl }) => {
    cleanupExpiredCache(prefix, ttl);
  });
};