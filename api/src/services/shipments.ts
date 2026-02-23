import { supabaseAdmin } from "../lib/supabase.js";
import {
  type ShipmentStatus,
  ALLOWED_TRANSITIONS,
  type UpdateShipmentStatusInput,
  type AddProofInput,
} from "../validation/shipments.js";
import { createAndPush } from "./notifications.js";

export async function getShipmentById(id: string, userId: string) {
  const { data, error } = await supabaseAdmin.from("shipments").select("*").eq("id", id).single();
  if (error) return { data: null, error };
  if (data.shipper_id !== userId && data.driver_id !== userId) return { data: null, error: { message: "Forbidden" } };
  return { data, error: null };
}

export async function listShipments(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("shipments")
    .select("*")
    .or(`shipper_id.eq.${userId},driver_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function listShipmentEvents(shipmentId: string, userId: string) {
  const { data: shipment, error: shipErr } = await getShipmentById(shipmentId, userId);
  if (shipErr || !shipment) return { data: null, error: shipErr || { message: "Not found" } };
  const { data, error } = await supabaseAdmin
    .from("shipment_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: true });
  return { data: data ?? [], error };
}

export async function updateShipmentStatus(
  shipmentId: string,
  userId: string,
  input: UpdateShipmentStatusInput
) {
  const { data: shipment, error: fetchErr } = await getShipmentById(shipmentId, userId);
  if (fetchErr || !shipment) return { data: null, error: fetchErr || { message: "Not found" } };
  if (shipment.driver_id !== userId) return { data: null, error: { message: "Only driver can update status" } };

  const current = shipment.status as ShipmentStatus;
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed?.includes(input.status as ShipmentStatus)) {
    return { data: null, error: { message: `Transition from ${current} to ${input.status} not allowed` } };
  }

  const { data, error } = await supabaseAdmin
    .from("shipments")
    .update({ status: input.status })
    .eq("id", shipmentId)
    .select()
    .single();
  if (error) return { data: null, error };

  await supabaseAdmin.from("shipment_events").insert({
    shipment_id: shipmentId,
    actor_id: userId,
    type: "status_updated",
    payload: { from: current, to: input.status },
  });

  if (input.status === "delivered") {
    await supabaseAdmin.from("listings").update({ status: "delivered" }).eq("id", data.listing_id);
  }
  if (input.status === "cancelled") {
    await supabaseAdmin.from("listings").update({ status: "cancelled" }).eq("id", data.listing_id);
  }

  if (input.status === "picked_up" || input.status === "delivered") {
    const title =
      input.status === "picked_up"
        ? "Colis enlevé"
        : "Colis livré";
    const body =
      input.status === "picked_up"
        ? "Le transporteur a enlevé le colis."
        : "Votre colis a été livré.";
    await createAndPush({
      user_id: data.shipper_id,
      type: `shipment_${input.status}`,
      title,
      body,
      data: { shipment_id: shipmentId },
    });
  }

  return { data, error: null };
}

export async function addProof(shipmentId: string, userId: string, input: AddProofInput) {
  const { data: shipment, error: fetchErr } = await getShipmentById(shipmentId, userId);
  if (fetchErr || !shipment) return { data: null, error: fetchErr || { message: "Not found" } };
  if (shipment.driver_id !== userId && shipment.shipper_id !== userId) return { data: null, error: { message: "Forbidden" } };

  const { data, error } = await supabaseAdmin
    .from("proofs")
    .insert({
      shipment_id: shipmentId,
      type: input.type,
      storage_path: input.storage_path,
    })
    .select()
    .single();
  if (error) return { data: null, error };

  await supabaseAdmin.from("shipment_events").insert({
    shipment_id: shipmentId,
    actor_id: userId,
    type: "proof_added",
    payload: { proof_id: data.id, type: input.type, storage_path: input.storage_path },
  });

  return { data, error: null };
}
