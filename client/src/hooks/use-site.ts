import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { offlineGet, offlineMutate } from "@/lib/offline-api";

const STALE_MS = 5 * 60 * 1000;

export function useCurrentSite() {
  return useQuery({
    queryKey: [api.sites.current.path],
    queryFn: async () => {
      const raw = await offlineGet<unknown>(api.sites.current.path, undefined, { returnNullOn404: true });
      if (raw == null) return null;
      return api.sites.current.responses[200].parse(raw);
    },
    staleTime: STALE_MS,
  });
}

export function useSiteByCode(code?: string) {
  return useQuery({
    queryKey: [api.sites.byCode.path, code],
    enabled: !!code,
    queryFn: async () => {
      if (!code) return null;
      const path = buildUrl(api.sites.byCode.path, { code });
      const raw = await offlineGet<unknown>(path, undefined, { returnNullOn404: true });
      if (raw == null) return null;
      return api.sites.byCode.responses[200].parse(raw);
    },
    staleTime: STALE_MS,
  });
}

export function useEnrollSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: number; role: string; code: string }) => {
      const payload = api.sites.enroll.input.parse(input);
      const raw = await offlineMutate<unknown>("POST", api.sites.enroll.path, payload);
      return api.sites.enroll.responses[200].parse(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sites.current.path] });
    },
  });
}

export function useApproveMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { membershipId: number; approverId: number; approverRole: string }) => {
      const payload = api.sites.approveMembership.input.parse({ approverId: input.approverId, approverRole: input.approverRole });
      const path = buildUrl(api.sites.approveMembership.path, { id: input.membershipId });
      const raw = await offlineMutate<unknown>("PATCH", path, payload);
      return api.sites.approveMembership.responses[200].parse(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sites.current.path] });
    },
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; location: string; code?: string }) => {
      const payload = api.sites.create.input.parse(input);
      const raw = await offlineMutate<unknown>("POST", api.sites.create.path, payload);
      return api.sites.create.responses[201].parse(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sites.current.path] });
    },
  });
}
