import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { offlineGet } from "@/lib/offline-api";

const STALE_MS = 5 * 60 * 1000;

export function useSiteVisibility(siteId?: number) {
  return useQuery({
    queryKey: [api.visibility.siteSnapshot.path, siteId],
    queryFn: async () => {
      if (!siteId) return null;
      const path = buildUrl(api.visibility.siteSnapshot.path, { siteId });
      const raw = await offlineGet<unknown>(path);
      if (!raw) throw new Error("Failed to load site snapshot");
      return api.visibility.siteSnapshot.responses[200].parse(raw);
    },
    enabled: !!siteId,
    staleTime: STALE_MS,
  });
}
