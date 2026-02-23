import { supabaseAdmin } from "../lib/supabase.js";
import type { CreateListingInput, UpdateListingInput, ListListingsQuery } from "../validation/listings.js";

export async function getListingById(id: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { data: null, error };
  if (data.shipper_id !== userId && data.status !== "active") return { data: null, error: { message: "Forbidden" } };
  return { data, error: null };
}

export async function listListingsFeed(query: { status?: string; limit?: number; offset?: number }) {
  const status = query.status ?? "active";
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return { data: data ?? [], error };
}

/** Listings with destination near (lat, lng) for map view. Uses bounding box (approx). */
export async function listListingsMap(query: {
  lat: number;
  lng: number;
  radius_km?: number;
  limit?: number;
}) {
  const { lat, lng, radius_km = 50, limit = 100 } = query;
  const degLat = radius_km / 111;
  const degLng = radius_km / (111 * Math.cos((lat * Math.PI) / 180));
  const minLat = lat - degLat;
  const maxLat = lat + degLat;
  const minLng = lng - degLng;
  const maxLng = lng + degLng;
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("status", "active")
    .not("destination_lat", "is", null)
    .not("destination_lng", "is", null)
    .gte("destination_lat", minLat)
    .lte("destination_lat", maxLat)
    .gte("destination_lng", minLng)
    .lte("destination_lng", maxLng)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}

export async function listListings(userId: string, query: ListListingsQuery) {
  let q = supabaseAdmin
    .from("listings")
    .select("*", { count: "exact" })
    .eq("shipper_id", userId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);
  if (query.status) q = q.eq("status", query.status);
  const { data, error, count } = await q;
  return { data: data ?? [], error, count: count ?? 0 };
}

export async function createListing(userId: string, input: CreateListingInput) {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .insert({
      shipper_id: userId,
      title: input.title,
      description: input.description ?? null,
      origin_city: input.origin_city ?? null,
      origin_lat: input.origin_lat ?? null,
      origin_lng: input.origin_lng ?? null,
      destination_city: input.destination_city ?? null,
      destination_lat: input.destination_lat ?? null,
      destination_lng: input.destination_lng ?? null,
      pickup_date: input.pickup_date ?? null,
      delivery_deadline: input.delivery_deadline ?? null,
      weight_kg: input.weight_kg ?? null,
      size_category: input.size_category ?? null,
      price_cents: input.price_cents ?? null,
    })
    .select()
    .single();
  return { data, error };
}

export async function updateListing(id: string, userId: string, input: UpdateListingInput) {
  const { data: existing } = await getListingById(id, userId);
  if (!existing) return { data: null, error: { message: "Forbidden or not found" } };
  const updates: Record<string, unknown> = { ...input };
  const { data, error } = await supabaseAdmin
    .from("listings")
    .update(updates)
    .eq("id", id)
    .eq("shipper_id", userId)
    .select()
    .single();
  return { data, error };
}

export async function deleteListing(id: string, userId: string) {
  const { error } = await supabaseAdmin
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("shipper_id", userId);
  return { error };
}
