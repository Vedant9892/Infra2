/**
 * Offline cache for API responses.
 * Used for cache-first reads and optimistic updates when offline.
 */

import { getStorage } from "./storage";

export interface CachedEntry<T = unknown> {
  data: T;
  updatedAt: string;
  etag?: string;
}

const CACHE_PREFIX = "cache:";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function cacheKey(path: string, query?: string): string {
  const q = query ? `?${query}` : "";
  return CACHE_PREFIX + path + q;
}

export async function getCached<T>(key: string): Promise<CachedEntry<T> | null> {
  const s = getStorage();
  const raw = await s.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (age > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T, etag?: string): Promise<void> {
  const s = getStorage();
  const entry: CachedEntry<T> = {
    data,
    updatedAt: new Date().toISOString(),
    ...(etag && { etag }),
  };
  await s.setItem(key, JSON.stringify(entry));
}

export async function invalidateCacheKey(key: string): Promise<void> {
  const s = getStorage();
  await s.removeItem(key);
}

export async function invalidateCachePattern(prefix: string): Promise<void> {
  const s = getStorage();
  const keys = await s.getAllKeys();
  for (const k of keys) {
    if (k.startsWith(CACHE_PREFIX) && k.includes(prefix)) await s.removeItem(k);
  }
}

export async function clearOfflineCache(): Promise<void> {
  const s = getStorage();
  const keys = await s.getAllKeys();
  for (const k of keys) {
    if (k.startsWith(CACHE_PREFIX)) await s.removeItem(k);
  }
}
