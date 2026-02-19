import { supabase } from "@/lib/supabase";
import type { SearchProposal, PackageDraft } from "@/types";

const TABLE = "proposals";

function mapRowToProposal(row: Record<string, unknown>): SearchProposal {
  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    from: (row.from_place as string) ?? "",
    to: (row.to_place as string) ?? "",
    datetime: row.datetime as string,
    package: row.package as PackageDraft,
    price: (row.price_cents as number) ?? 0,
    status: (row.status as SearchProposal["status"]) ?? "sent",
    created_at: row.created_at as string,
  };
}

export async function createProposal(
  ownerId: string,
  data: { from: string; to: string; datetime: string; package: PackageDraft; price: number }
): Promise<{ data: SearchProposal | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from(TABLE)
      .insert({
        owner_id: ownerId,
        from_place: data.from,
        to_place: data.to,
        datetime: data.datetime,
        package: data.package,
        price_cents: data.price,
        status: "sent",
      })
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: mapRowToProposal(row), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error("createProposal failed") };
  }
}

export async function listMyProposals(ownerId: string): Promise<{ data: SearchProposal[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data ?? []).map(mapRowToProposal), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error("listMyProposals failed") };
  }
}
