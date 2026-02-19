import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { Proposal } from "@/types";

export function useProposalsInbox() {
  return useQuery({
    queryKey: ["proposals-inbox"],
    queryFn: async () => {
      const { data, error } = await apiGet<{ data: Proposal[] }>("/proposals");
      if (error) throw new Error(error);
      return data?.data ?? [];
    },
  });
}

type CreateProposalBody = { listing_id: string; trip_id?: string | null; price_cents?: number; message?: string };

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateProposalBody) => {
      const { data, error } = await apiPost<Proposal>("/proposals", body);
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["listing", v.listing_id] });
      qc.invalidateQueries({ queryKey: ["proposals-inbox"] });
    },
  });
}

type AcceptResult = { shipment: { id: string }; proposal_id: string };

export function useAcceptProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: string) => {
      const { data, error } = await apiPost<AcceptResult>(`/proposals/${proposalId}/accept`, {});
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposals-inbox"] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: string) => {
      const { data, error } = await apiPost<Proposal>(`/proposals/${proposalId}/reject`, {});
      if (error) throw new Error(error);
      return data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals-inbox"] }),
  });
}
