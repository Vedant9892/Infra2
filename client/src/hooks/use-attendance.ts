import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertAttendance } from "@shared/routes";

export function useAttendanceHistory() {
  return useQuery({
    queryKey: [api.attendance.history.path],
    queryFn: async () => {
      const res = await fetch(api.attendance.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance history");
      return api.attendance.history.responses[200].parse(await res.json());
    },
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAttendance) => {
      // Validate with shared schema before sending
      const validated = api.attendance.mark.input.parse(data);
      
      const res = await fetch(api.attendance.mark.path, {
        method: api.attendance.mark.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to mark attendance");
      return api.attendance.mark.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.history.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] }); // Refresh stats
    },
  });
}
