import { supabase } from "@/lib/supabase";

const TABLE = "trip_locations";

export async function upsertTripLocation(
  tripId: string,
  userId: string,
  lat: number,
  lng: number
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from(TABLE).upsert(
      {
        trip_id: tripId,
        user_id: userId,
        lat,
        lng,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trip_id" }
    );
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error("upsertTripLocation failed") };
  }
}

export async function listTripLocations(
  tripIds: string[]
): Promise<{ data: { trip_id: string; lat: number; lng: number; updated_at: string }[]; error: Error | null }> {
  if (tripIds.length === 0) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("trip_id, lat, lng, updated_at")
      .in("trip_id", tripIds);
    if (error) return { data: [], error: new Error(error.message) };
    return { data: data ?? [], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error("listTripLocations failed") };
  }
}
