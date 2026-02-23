import { supabaseAdmin } from "../lib/supabase.js";

export async function registerDevice(userId: string, expoPushToken: string) {
  const { data, error } = await supabaseAdmin
    .from("device_tokens")
    .upsert({ user_id: userId, expo_push_token: expoPushToken }, { onConflict: "expo_push_token" })
    .select()
    .single();
  return { data, error };
}

export async function getDeviceTokensForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("device_tokens")
    .select("expo_push_token")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((r) => r.expo_push_token).filter(Boolean);
}

export async function getDeviceTokensForUsers(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await supabaseAdmin
    .from("device_tokens")
    .select("user_id, expo_push_token")
    .in("user_id", userIds);
  if (error || !data) return new Map();
  const map = new Map<string, string[]>();
  for (const row of data) {
    const list = map.get(row.user_id) ?? [];
    list.push(row.expo_push_token);
    map.set(row.user_id, list);
  }
  return map;
}
