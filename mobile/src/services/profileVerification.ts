import { supabase } from "@/lib/supabase";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type ProfileVerification = {
  user_id: string;
  role: "shipper" | "driver";
  status: VerificationStatus;
  id_doc_url?: string | null;
  vehicle_doc_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

const TABLE = "profile_verifications";
const BUCKET = "verification-docs";

export async function getProfileVerification(
  userId: string
): Promise<{ data: ProfileVerification | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as ProfileVerification, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("getProfileVerification failed") };
  }
}

export async function uploadVerificationDoc(
  userId: string,
  type: "id" | "vehicle",
  uri: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filePath = `${userId}/${type}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
    if (error) return { url: null, error: new Error(error.message) };
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return { url: publicUrl.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e : new Error("uploadVerificationDoc failed") };
  }
}

export async function submitProfileVerification(
  payload: ProfileVerification
): Promise<{ data: ProfileVerification | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(
        {
          user_id: payload.user_id,
          role: payload.role,
          status: payload.status,
          id_doc_url: payload.id_doc_url ?? null,
          vehicle_doc_url: payload.vehicle_doc_url ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as ProfileVerification, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("submitProfileVerification failed") };
  }
}

export async function listPendingVerifications(
  role?: ProfileVerification["role"]
): Promise<{ data: ProfileVerification[]; error: Error | null }> {
  try {
    let query = supabase.from(TABLE).select("*").eq("status", "pending").order("created_at", { ascending: true });
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data ?? []) as ProfileVerification[], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error("listPendingVerifications failed") };
  }
}

export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus
): Promise<{ data: ProfileVerification | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as ProfileVerification, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("updateVerificationStatus failed") };
  }
}
