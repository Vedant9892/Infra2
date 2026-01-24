import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { offlineGet, offlineMutate } from "@/lib/offline-api";

const STALE_MS = 5 * 60 * 1000;

export function useMaterialRequests(siteId?: number) {
  return useQuery({
    queryKey: [api.materials.list.path, siteId],
    queryFn: async () => {
      const query = siteId != null ? `siteId=${siteId}` : undefined;
      const raw = await offlineGet<unknown>(api.materials.list.path, query);
      if (!raw) throw new Error("Failed to fetch material requests");
      return api.materials.list.responses[200].parse(raw);
    },
    staleTime: STALE_MS,
  });
}

export function useCreateMaterialRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const payload = api.materials.create.input.parse(input);
      const raw = await offlineMutate<unknown>("POST", api.materials.create.path, payload);
      return api.materials.create.responses[201].parse(raw);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.materials.list.path, variables.siteId] });
      queryClient.invalidateQueries({ queryKey: [api.visibility.siteSnapshot.path] });
    },
  });
}

export function useUpdateMaterialStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'requested' | 'approved' | 'rejected' | 'partial' }) => {
      const path = buildUrl(api.materials.updateStatus.path, { id });
      const raw = await offlineMutate<unknown>("PATCH", path, { status });
      return api.materials.updateStatus.responses[200].parse(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.materials.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.visibility.siteSnapshot.path] });
    },
  });
}
