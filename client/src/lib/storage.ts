/**
 * Storage adapter for offline cache and sync queue.
 * Uses localStorage in browser; inject AsyncStorage for React Native if needed.
 */

const PREFIX = "infra_offline:";

export type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<string[]>;
};

function localStorageAdapter(): StorageAdapter {
  return {
    async getItem(key: string) {
      try {
        return localStorage.getItem(PREFIX + key);
      } catch {
        return null;
      }
    },
    async setItem(key: string, value: string) {
      localStorage.setItem(PREFIX + key, value);
    },
    async removeItem(key: string) {
      localStorage.removeItem(PREFIX + key);
    },
    async getAllKeys() {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
      }
      return keys;
    },
  };
}

let _adapter: StorageAdapter | null = null;

export function setStorageAdapter(adapter: StorageAdapter) {
  _adapter = adapter;
}

export function getStorage(): StorageAdapter {
  if (!_adapter) _adapter = localStorageAdapter();
  return _adapter;
}
