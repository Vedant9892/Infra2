/**
 * Offline-aware API client.
 * GET: cache-first when offline, fetch + cache when online.
 * Mutations: enqueue when offline, fetch when online. LWW on sync.
 */

import { getCached, setCached, cacheKey } from "./offline-cache";
import { isOnline, enqueue, processQueue } from "./offline-sync";

export type OfflineFetchOptions = {
  baseUrl?: string;
  credentials?: RequestCredentials;
};

const defaultOpts: OfflineFetchOptions = {
  baseUrl: "",
  credentials: "include",
};

let _opts = { ...defaultOpts };

export function configureOfflineApi(opts: Partial<OfflineFetchOptions>) {
  _opts = { ..._opts, ...opts };
}

function url(path: string, base?: string): string {
  const b = base ?? _opts.baseUrl ?? "";
  return b ? `${b}${path}` : path;
}

export type OfflineGetOptions = {
  /** Return null instead of throwing on 404 (e.g. /users/me, /sites/by-code/:code). */
  returnNullOn404?: boolean;
};

/**
 * GET: online → fetch, cache, return. Offline → return from cache or throw.
 */
export async function offlineGet<T = unknown>(
  path: string,
  query?: string,
  opts?: OfflineGetOptions
): Promise<T | null> {
  const fullPath = query ? `${path}?${query}` : path;
  const key = cacheKey(path, query);
  const online = isOnline();

  if (online) {
    const res = await fetch(url(fullPath), {
      method: "GET",
      credentials: _opts.credentials,
      headers: { Accept: "application/json" },
    });
    if (res.status === 404 && opts?.returnNullOn404) return null;
    if (!res.ok) {
      const cached = await getCached<T>(key);
      if (cached) return cached.data as T;
      throw new Error(`GET ${path}: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as T;
    await setCached(key, data);
    return data;
  }

  const cached = await getCached<T>(key);
  if (cached) return cached.data as T;
  throw new Error(`Offline: no cached data for ${path}`);
}

/**
 * Mutation (POST/PATCH/PUT/DELETE): online → fetch, return. Offline → enqueue, throw (UI shows "will sync when online").
 */
export async function offlineMutate<T = unknown>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const online = isOnline();

  if (online) {
    const res = await fetch(url(path), {
      method,
      credentials: _opts.credentials,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  }

  const actionId = await enqueue(method, path, body);
  throw new Error(`Offline: queued for sync (${actionId})`);
}

/**
 * Process sync queue (call when coming online).
 */
export async function performSync(): Promise<{ synced: number; failed: number }> {
  const base = _opts.baseUrl ?? "";
  return processQueue(base, (u, init) => fetch(u, { ...init, credentials: _opts.credentials }));
}

export { isOnline, getPendingCount, getLastSyncTime, subscribeToNetwork } from "./offline-sync";
export { getCached, setCached, cacheKey, clearOfflineCache, invalidateCachePattern } from "./offline-cache";
