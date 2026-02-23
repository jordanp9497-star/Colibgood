import { supabaseAdmin } from "../lib/supabase.js";
import type { CreateTripInput, UpdateTripInput, ListTripsQuery } from "../validation/trips.js";
import { isVerificationApproved } from "./verification.js";

export async function getTripById(id: string, userId: string) {
  const { data, error } = await supabaseAdmin.from("trips").select("*").eq("id", id).single();
  if (error) return { data: null, error };
  if (data.driver_id !== userId) {
    const { data: proposal } = await supabaseAdmin
      .from("proposals")
      .select("id")
      .eq("trip_id", id)
      .eq("shipper_id", userId)
      .maybeSingle();
    if (!proposal) return { data: null, error: { message: "Forbidden" } };
  }
  return { data, error: null };
}

export async function listTrips(userId: string, query: ListTripsQuery) {
  let q = supabaseAdmin
    .from("trips")
    .select("*", { count: "exact" })
    .eq("driver_id", userId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);
  const { data, error, count } = await q;
  return { data: data ?? [], error, count: count ?? 0 };
}

export async function createTrip(userId: string, input: CreateTripInput) {
  const ok = await isVerificationApproved(userId, "driver");
  if (!ok) return { data: null, error: { message: "Profile verification required" } };
  const { data, error } = await supabaseAdmin
    .from("trips")
    .insert({
      driver_id: userId,
      origin_city: input.origin_city ?? null,
      origin_lat: input.origin_lat ?? null,
      origin_lng: input.origin_lng ?? null,
      destination_city: input.destination_city ?? null,
      destination_lat: input.destination_lat ?? null,
      destination_lng: input.destination_lng ?? null,
      depart_datetime: input.depart_datetime ?? null,
      arrive_datetime: input.arrive_datetime ?? null,
      capacity_kg: input.capacity_kg ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  return { data, error };
}

export async function updateTrip(id: string, userId: string, input: UpdateTripInput) {
  const { data: existing } = await supabaseAdmin.from("trips").select("id").eq("id", id).eq("driver_id", userId).single();
  if (!existing) return { data: null, error: { message: "Forbidden or not found" } };
  const updates: Record<string, unknown> = { ...input };
  const { data, error } = await supabaseAdmin
    .from("trips")
    .update(updates)
    .eq("id", id)
    .eq("driver_id", userId)
    .select()
    .single();
  return { data, error };
}

export async function deleteTrip(id: string, userId: string) {
  const { error } = await supabaseAdmin.from("trips").delete().eq("id", id).eq("driver_id", userId);
  return { error };
}
