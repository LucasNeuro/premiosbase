import { useState, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
}

export function useCache<T>(options: CacheOptions = {}) {
  const [cache] = useState<Map<string, CacheItem<T>>>(new Map());
  const defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default

  const get = useCallback((key: string): T | null => {
    const item = cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      cache.delete(key);
      return null;
    }

    return item.data;
  }, [cache]);

  const set = useCallback((key: string, data: T, ttl?: number): void => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || defaultTTL
    });
  }, [cache, defaultTTL]);

  const clear = useCallback((key?: string): void => {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }, [cache]);

  const has = useCallback((key: string): boolean => {
    const item = cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      cache.delete(key);
      return false;
    }

    return true;
  }, [cache]);

  return { get, set, clear, has };
}
