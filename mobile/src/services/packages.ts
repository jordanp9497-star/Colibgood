import { supabase } from "@/lib/supabase";
import type { PublishedPackageListing } from "@/types";

const TABLE = "package_listings";
const BUCKET = "package-images";

function mapRowToPackage(row: Record<string, unknown>): PublishedPackageListing {
  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    from: (row.from_place as string) ?? "",
    to: (row.to_place as string) ?? "",
    deadline: row.deadline as string,
    length: (row.length_cm as number) ?? 0,
    width: (row.width_cm as number) ?? 0,
    height: (row.height_cm as number) ?? 0,
    weight: (row.weight_kg as number) ?? 0,
    content: (row.content as string) ?? "",
    description: (row.description as string) ?? "",
    image_url: (row.image_url as string) ?? "",
    status: (row.status as PublishedPackageListing["status"]) ?? "published",
    created_at: row.created_at as string,
  };
}

export async function createPackageListing(
  ownerId: string,
  data: {
    from: string;
    to: string;
    deadline: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    content: string;
    description?: string;
    image_url?: string;
  }
): Promise<{ data: PublishedPackageListing | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .insert({
        owner_id: ownerId,
        from_place: data.from,
        to_place: data.to,
        deadline: data.deadline,
        length_cm: data.length,
        width_cm: data.width,
        height_cm: data.height,
        weight_kg: data.weight,
        content: data.content,
        description: data.description ?? null,
        image_url: data.image_url ?? null,
        status: "published",
      })
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToPackage(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("createPackageListing failed") };
  }
}

export async function listMyPackages(ownerId: string): Promise<{ data: PublishedPackageListing[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data ?? []).map(mapRowToPackage), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error("listMyPackages failed") };
  }
}

export async function listPackages(
  status: PublishedPackageListing["status"][] = ["published"]
): Promise<{ data: PublishedPackageListing[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("status", status)
      .order("created_at", { ascending: false });
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data ?? []).map(mapRowToPackage), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error("listPackages failed") };
  }
}

export async function getPackageById(id: string): Promise<{ data: PublishedPackageListing | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToPackage(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("getPackageById failed") };
  }
}

export async function updatePackageListing(
  id: string,
  data: {
    from: string;
    to: string;
    deadline: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    content: string;
    description?: string;
    image_url?: string;
  }
): Promise<{ data: PublishedPackageListing | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .update({
        from_place: data.from,
        to_place: data.to,
        deadline: data.deadline,
        length_cm: data.length,
        width_cm: data.width,
        height_cm: data.height,
        weight_kg: data.weight,
        content: data.content,
        description: data.description ?? null,
        image_url: data.image_url ?? null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToPackage(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("updatePackageListing failed") };
  }
}

export async function updatePackageStatus(
  id: string,
  status: PublishedPackageListing["status"]
): Promise<{ data: PublishedPackageListing | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToPackage(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("updatePackageStatus failed") };
  }
}

export async function uploadPackageImage(
  ownerId: string,
  uri: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filePath = `${ownerId}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
    if (error) return { url: null, error: new Error(error.message) };
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return { url: publicUrl.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e : new Error("uploadPackageImage failed") };
  }
}
