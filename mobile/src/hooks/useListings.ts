import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Listing } from "@/types";

export function useListings(params?: { status?: string; limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const query = q.toString();
  return useQuery({
    queryKey: ["listings", params],
    queryFn: async () => {
      const { data, error } = await apiGet<{ data: Listing[]; count: number }>(`/listings${query ? `?${query}` : ""}`);
      if (error) throw new Error(error);
      return data!;
    },
  });
}

export function useListingsFeed(params?: { status?: string; limit?: number; offset?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status ?? "active");
  if (params?.limit) q.set("limit", String(params.limit ?? 20));
  if (params?.offset) q.set("offset", String(params.offset ?? 0));
  const query = q.toString();
  return useQuery({
    queryKey: ["listings-feed", params],
    queryFn: async () => {
      const { data, error } = await apiGet<{ data: Listing[] }>(`/listings/feed${query ? `?${query}` : ""}`);
      if (error) throw new Error(error);
      return data!.data;
    },
  });
}

export function useListingsMap(params: { lat: number; lng: number; radius_km?: number } | null) {
  const enabled = params != null && !Number.isNaN(params.lat) && !Number.isNaN(params.lng);
  const q = new URLSearchParams();
  if (params) {
    q.set("lat", String(params.lat));
    q.set("lng", String(params.lng));
    if (params.radius_km != null) q.set("radius_km", String(params.radius_km));
  }
  const query = q.toString();
  return useQuery({
    queryKey: ["listings-map", params?.lat, params?.lng, params?.radius_km],
    queryFn: async () => {
      const { data, error } = await apiGet<{ data: Listing[] }>(`/listings/map?${query}`);
      if (error) throw new Error(error);
      return data!.data ?? [];
    },
    enabled,
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await apiGet<Listing>(`/listings/${id}`);
      if (error) throw new Error(error);
      return data!;
    },
    enabled: !!id,
  });
}

type CreateListingBody = {
  title: string;
  description?: string;
  origin_city?: string;
  destination_city?: string;
  pickup_date?: string;
  delivery_deadline?: string;
  weight_kg?: number;
  size_category?: string;
  price_cents?: number;
};

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateListingBody) => {
      const { data, error } = await apiPost<Listing>("/listings", body);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

export function useUpdateListing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<CreateListingBody> & { status?: string }) => {
      const { data, error } = await apiPatch<Listing>(`/listings/${id}`, body);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: (_, __, ___) => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["listing", id] });
    },
  });
}

export function useDeleteListing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await apiDelete(`/listings/${id}`);
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}
