/**
 * Data Sync Context - Makes all dashboards communicate with each other
 * When data changes in one screen, all other screens update automatically
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type DataSyncContextType = {
  refreshKey: number;
  triggerRefresh: () => void;
  subscribe: (callback: () => void) => () => void;
};

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [subscribers, setSubscribers] = useState<Set<() => void>>(new Set());

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    subscribers.forEach((cb) => cb());
  }, [subscribers]);

  const subscribe = useCallback((callback: () => void) => {
    setSubscribers((s) => new Set([...s, callback]));
    return () => {
      setSubscribers((s) => {
        const newSet = new Set(s);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  return (
    <DataSyncContext.Provider value={{ refreshKey, triggerRefresh, subscribe }}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within DataSyncProvider');
  }
  return context;
}
