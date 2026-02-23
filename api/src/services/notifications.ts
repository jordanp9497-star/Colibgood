import { supabaseAdmin } from "../lib/supabase.js";
import { sendExpoPush } from "../lib/expo-push.js";
import { getDeviceTokensForUser } from "./devices.js";

export async function listNotifications(userId: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}

export type CreateNotificationInput = {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

export async function createNotification(input: CreateNotificationInput) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data: input.data ?? null,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Crée une notification in-app et envoie un push Expo à l'utilisateur.
 */
export async function createAndPush(input: CreateNotificationInput): Promise<void> {
  const { error } = await createNotification(input);
  if (error) console.error("createNotification failed", error);
  const tokens = await getDeviceTokensForUser(input.user_id);
  if (tokens.length > 0) {
    const messages = tokens.map((to) => ({
      to,
      title: input.title,
      body: input.body ?? "",
      data: input.data ?? {},
    }));
    const result = await sendExpoPush(messages);
    if (result.failed > 0) console.warn("Expo push: some failed", result);
  }
}
