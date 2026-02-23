import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

/**
 * Client used only to verify JWT (getUser). Uses anon key so we don't pass service role to middleware.
 * If SUPABASE_ANON_KEY is not set, we use service role for verification (works but less ideal).
 */
const authClient = createClient(config.supabase.url, config.supabase.anonKey || config.supabase.serviceRoleKey, {
  auth: { persistSession: false },
});

export async function getUserFromJwt(accessToken: string): Promise<{ id: string } | null> {
  const { data: { user }, error } = await authClient.auth.getUser(accessToken);
  if (error || !user) return null;
  return { id: user.id };
}
