import { useState, useEffect, useCallback } from "react";
import {
  isOnline,
  subscribeToNetwork,
  getPendingCount,
  performSync,
} from "@/lib/offline-api";
import { useQueryClient } from "@tanstack/react-query";

export function useOnline() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const check = useCallback(() => {
    setOnline(isOnline());
    getPendingCount().then(setPendingCount);
  }, []);

  useEffect(() => {
    const onOnline = async () => {
      setOnline(true);
      setSyncing(true);
      try {
        const { synced } = await performSync();
        if (synced > 0) {
          queryClient.invalidateQueries();
        }
        await getPendingCount().then(setPendingCount);
      } finally {
        setSyncing(false);
      }
    };

    const unsub = subscribeToNetwork(onOnline, check);
    check();
    return unsub;
  }, [queryClient, check]);

  return { online, pendingCount, syncing };
}
