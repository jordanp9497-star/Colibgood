import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Trip } from "@/types";

export function useTrips(params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const query = q.toString();
  return useQuery({
    queryKey: ["trips", params],
    queryFn: async () => {
      const { data, error } = await apiGet<{ data: Trip[]; count: number }>(`/trips${query ? `?${query}` : ""}`);
      if (error) throw new Error(error);
      return data!;
    },
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await apiGet<Trip>(`/trips/${id}`);
      if (error) throw new Error(error);
      return data!;
    },
    enabled: !!id,
  });
}

type CreateTripBody = {
  origin_city?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_city?: string;
  destination_lat?: number;
  destination_lng?: number;
  depart_datetime?: string;
  arrive_datetime?: string;
  capacity_kg?: number;
  notes?: string;
};

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTripBody) => {
      const { data, error } = await apiPost<Trip>("/trips", body);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useUpdateTrip(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<CreateTripBody>) => {
      const { data, error } = await apiPatch<Trip>(`/trips/${id}`, body);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["trip", id] });
    },
  });
}

export function useDeleteTrip(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await apiDelete(`/trips/${id}`);
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}
