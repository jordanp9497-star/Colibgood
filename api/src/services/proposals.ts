import { supabaseAdmin } from "../lib/supabase.js";
import type { CreateProposalInput } from "../validation/proposals.js";
import { isVerificationApproved } from "./verification.js";
import { createAndPush } from "./notifications.js";

export async function getProposalById(id: string, userId: string) {
  const { data, error } = await supabaseAdmin.from("proposals").select("*").eq("id", id).single();
  if (error) return { data: null, error };
  if (data.shipper_id !== userId && data.driver_id !== userId) return { data: null, error: { message: "Forbidden" } };
  return { data, error: null };
}

export async function listProposals(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("proposals")
    .select("*")
    .or(`shipper_id.eq.${userId},driver_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function createProposal(userId: string, input: CreateProposalInput) {
  const ok = await isVerificationApproved(userId, "driver");
  if (!ok) return { data: null, error: { message: "Profile verification required" } };
  const { data: listing } = await supabaseAdmin.from("listings").select("shipper_id, status").eq("id", input.listing_id).single();
  if (!listing) return { data: null, error: { message: "Listing not found" } };
  if (listing.shipper_id === userId) return { data: null, error: { message: "Shipper cannot propose on own listing" } };
  if (listing.status !== "active") return { data: null, error: { message: "Listing is not active" } };
  if (input.trip_id) {
    const { data: trip } = await supabaseAdmin.from("trips").select("driver_id").eq("id", input.trip_id).single();
    if (!trip || trip.driver_id !== userId) return { data: null, error: { message: "Trip not found or not yours" } };
  }
  const { data, error } = await supabaseAdmin
    .from("proposals")
    .insert({
      listing_id: input.listing_id,
      trip_id: input.trip_id ?? null,
      driver_id: userId,
      shipper_id: listing.shipper_id,
      price_cents: input.price_cents ?? null,
      message: input.message ?? null,
    })
    .select()
    .single();
  if (!error && data) {
    await createAndPush({
      user_id: listing.shipper_id,
      type: "proposal_received",
      title: "Nouvelle proposition",
      body: "Vous avez reçu une proposition sur votre annonce.",
      data: { proposal_id: data.id, listing_id: input.listing_id },
    });
  }
  return { data, error };
}

/**
 * Accept a proposal: create shipment, set proposal accepted, reject other proposals for same listing.
 */
export async function acceptProposal(proposalId: string, userId: string) {
  const { data: proposal, error: propErr } = await getProposalById(proposalId, userId);
  if (propErr || !proposal) return { data: null, error: propErr || { message: "Proposal not found" } };
  if (proposal.shipper_id !== userId) return { data: null, error: { message: "Only shipper can accept" } };
  if (proposal.status !== "pending") return { data: null, error: { message: "Proposal is not pending" } };

  const { data: existingShipment } = await supabaseAdmin
    .from("shipments")
    .select("id")
    .eq("listing_id", proposal.listing_id)
    .maybeSingle();
  if (existingShipment) return { data: null, error: { message: "A shipment already exists for this listing" } };

  const { data: shipment, error: shipErr } = await supabaseAdmin
    .from("shipments")
    .insert({
      listing_id: proposal.listing_id,
      driver_id: proposal.driver_id,
      shipper_id: proposal.shipper_id,
    })
    .select()
    .single();
  if (shipErr || !shipment) {
    const code = (shipErr as unknown as { code?: string } | null)?.code;
    if (code === "23505") return { data: null, error: { message: "A shipment already exists for this listing" } };
    return { data: null, error: shipErr || { message: "Failed to create shipment" } };
  }

  await supabaseAdmin.from("listings").update({ status: "matched" }).eq("id", proposal.listing_id);

  await supabaseAdmin.from("shipment_events").insert({
    shipment_id: shipment.id,
    actor_id: userId,
    type: "shipment_created",
    payload: { proposal_id: proposalId, listing_id: proposal.listing_id },
  });

  await supabaseAdmin.from("proposals").update({ status: "accepted" }).eq("id", proposalId);
  await supabaseAdmin
    .from("proposals")
    .update({ status: "rejected" })
    .eq("listing_id", proposal.listing_id)
    .neq("id", proposalId);

  await createAndPush({
    user_id: proposal.driver_id,
    type: "proposal_accepted",
    title: "Proposition acceptée",
    body: "Votre proposition a été acceptée. Vous pouvez démarrer l'expédition.",
    data: { proposal_id: proposalId, shipment_id: shipment.id, listing_id: proposal.listing_id },
  });

  return { data: { shipment, proposal_id: proposalId }, error: null };
}

export async function rejectProposal(proposalId: string, userId: string) {
  const { data: proposal, error: propErr } = await getProposalById(proposalId, userId);
  if (propErr || !proposal) return { data: null, error: propErr || { message: "Proposal not found" } };
  if (proposal.shipper_id !== userId) return { data: null, error: { message: "Only shipper can reject" } };
  if (proposal.status !== "pending") return { data: null, error: { message: "Proposal is not pending" } };
  const { data, error } = await supabaseAdmin
    .from("proposals")
    .update({ status: "rejected" })
    .eq("id", proposalId)
    .select()
    .single();
  return { data, error };
}
