import { supabaseAdmin } from "../lib/supabase.js";

export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("user_id", userId).single();
  return { data, error };
}
