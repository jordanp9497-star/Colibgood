import { supabase } from "@/lib/supabase";
import type { PublishedTrip } from "@/types";

const TABLE = "trips";

function mapRowToTrip(row: Record<string, unknown>): PublishedTrip {
  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    from: (row.from_place as string) ?? "",
    to: (row.to_place as string) ?? "",
    datetime: row.datetime as string,
    vehicle_type: (row.vehicle_type as PublishedTrip["vehicle_type"]) ?? "voiture",
    capacity: (row.capacity as PublishedTrip["capacity"]) ?? undefined,
    status: (row.status as PublishedTrip["status"]) ?? "published",
    created_at: row.created_at as string,
  };
}

export async function createTrip(
  ownerId: string,
  data: {
    from: string;
    to: string;
    datetime: string;
    vehicle_type: string;
    capacity?: string;
  }
): Promise<{ data: PublishedTrip | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .insert({
        owner_id: ownerId,
        from_place: data.from,
        to_place: data.to,
        datetime: data.datetime,
        vehicle_type: data.vehicle_type,
        status: "published",
      })
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToTrip(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("createTrip failed") };
  }
}

export async function listMyTrips(ownerId: string): Promise<{ data: PublishedTrip[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data ?? []).map(mapRowToTrip), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error("listMyTrips failed") };
  }
}

export async function listTrips(
  status: PublishedTrip["status"][] = ["published"]
): Promise<{ data: PublishedTrip[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("status", status)
      .order("created_at", { ascending: false });
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data ?? []).map(mapRowToTrip), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error("listTrips failed") };
  }
}

export async function getTripById(id: string): Promise<{ data: PublishedTrip | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToTrip(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("getTripById failed") };
  }
}

export async function updateTrip(
  id: string,
  data: { from: string; to: string; datetime: string; vehicle_type: string }
): Promise<{ data: PublishedTrip | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .update({
        from_place: data.from,
        to_place: data.to,
        datetime: data.datetime,
        vehicle_type: data.vehicle_type,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToTrip(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("updateTrip failed") };
  }
}

export async function updateTripStatus(
  id: string,
  status: PublishedTrip["status"]
): Promise<{ data: PublishedTrip | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToTrip(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("updateTripStatus failed") };
  }
}
