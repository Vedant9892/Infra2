import { useQuery } from "@tanstack/react-query";
import { api, type UserResponse } from "@shared/routes";

export function useUser() {
  return useQuery({
    queryKey: [api.users.me.path],
    queryFn: async () => {
      const res = await fetch(api.users.me.path, { credentials: "include" });
      if (res.status === 404) return null; // Handle not logged in or not found gracefully
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return api.users.me.responses[200].parse(await res.json());
    },
    retry: false,
  });
}
