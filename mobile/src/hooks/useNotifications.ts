import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { NotificationRow } from "@/types";

export function useNotifications(limit = 50) {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: async () => {
      const { data, error } = await apiGet<{ data: NotificationRow[] }>(`/notifications?${q.toString()}`);
      if (error) throw new Error(error);
      return data?.data ?? [];
    },
  });
}

