import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { Shipment, ShipmentEvent } from "@/types";

export function useShipments() {
  return useQuery({
    queryKey: ["shipments"],
    queryFn: async () => {
      const { data, error } = await apiGet<{ data: Shipment[] }>("/shipments");
      if (error) throw new Error(error);
      return (data?.data ?? []) as Shipment[];
    },
  });
}

export function useShipment(id: string | undefined) {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await apiGet<Shipment>(`/shipments/${id}`);
      if (error) throw new Error(error);
      return data!;
    },
    enabled: !!id,
  });
}

export function useShipmentEvents(shipmentId: string | undefined) {
  return useQuery({
    queryKey: ["shipment-events", shipmentId],
    queryFn: async () => {
      if (!shipmentId) return [];
      const { data, error } = await apiGet<ShipmentEvent[]>(`/shipments/${shipmentId}/events`);
      if (error) throw new Error(error);
      return (data ?? []) as ShipmentEvent[];
    },
    enabled: !!shipmentId,
  });
}

export function useUpdateShipmentStatus(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const { data, error } = await apiPost<Shipment>(`/shipments/${shipmentId}/status`, { status });
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["shipment-events", shipmentId] });
    },
  });
}

export function useAddProof(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { type: string; storage_path: string }) => {
      const { data, error } = await apiPost<{ id: string }>(`/shipments/${shipmentId}/proof`, body);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      qc.invalidateQueries({ queryKey: ["shipment-events", shipmentId] });
    },
  });
}
