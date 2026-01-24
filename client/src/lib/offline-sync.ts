/**
 * Offline sync: online detection, pending action queue, background sync,
 * and conflict resolution (LWW).
 */

import { getStorage } from "./storage";

const QUEUE_KEY = "sync_queue";
const LAST_SYNC_KEY = "sync_last";
const MAX_RETRIES = 5;

export type PendingAction = {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  retryCount: number;
  timestamp: string;
};

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === true;
}

export function subscribeToNetwork(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

async function getQueue(): Promise<PendingAction[]> {
  const s = getStorage();
  const raw = await s.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveQueue(queue: PendingAction[]): Promise<void> {
  const s = getStorage();
  await s.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(
  method: string,
  path: string,
  body?: unknown
): Promise<string> {
  const id = `action_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const queue = await getQueue();
  queue.push({
    id,
    method,
    path,
    body,
    retryCount: 0,
    timestamp: new Date().toISOString(),
  });
  await saveQueue(queue);
  return id;
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await saveQueue(queue.filter((a) => a.id !== id));
}

export async function incrementRetry(id: string): Promise<void> {
  const queue = await getQueue();
  const idx = queue.findIndex((a) => a.id === id);
  if (idx >= 0) {
    queue[idx].retryCount += 1;
    await saveQueue(queue);
  }
}

export async function getPendingCount(): Promise<number> {
  return (await getQueue()).length;
}

export async function getLastSyncTime(): Promise<Date | null> {
  const s = getStorage();
  const raw = await s.getItem(LAST_SYNC_KEY);
  return raw ? new Date(raw) : null;
}

async function setLastSyncTime(): Promise<void> {
  const s = getStorage();
  await s.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

/** Process sync queue: run each action, remove on success, increment retry on fail. LWW: server wins. */
export async function processQueue(
  baseUrl: string,
  fetchFn: (url: string, init: RequestInit) => Promise<Response>
): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;
  const queue = await getQueue();

  for (const action of queue) {
    if (action.retryCount >= MAX_RETRIES) {
      await removeFromQueue(action.id);
      failed++;
      continue;
    }

    const url = baseUrl ? `${baseUrl}${action.path}` : action.path;
    try {
      const res = await fetchFn(url, {
        method: action.method,
        headers: action.body
          ? { "Content-Type": "application/json" }
          : undefined,
        body: action.body ? JSON.stringify(action.body) : undefined,
        credentials: "include",
      });

      if (res.ok) {
        await removeFromQueue(action.id);
        synced++;
      } else {
        await incrementRetry(action.id);
        failed++;
      }
    } catch {
      await incrementRetry(action.id);
      failed++;
    }
  }

  if (synced > 0) await setLastSyncTime();
  return { synced, failed };
}

export async function clearQueue(): Promise<void> {
  const s = getStorage();
  await s.removeItem(QUEUE_KEY);
  await s.removeItem(LAST_SYNC_KEY);
}
