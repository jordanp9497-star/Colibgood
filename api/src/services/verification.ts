import { supabaseAdmin } from "../lib/supabase.js";

export async function isVerificationApproved(userId: string, role: "shipper" | "driver"): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("profile_verifications")
    .select("status, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  if (data.role !== role) return false;
  return data.status === "approved";
}

