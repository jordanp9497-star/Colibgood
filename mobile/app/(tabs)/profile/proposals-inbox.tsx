import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useProposalsInbox, useAcceptProposal, useRejectProposal } from "@/hooks/useProposals";
import { useAuth } from "@/contexts/AuthContext";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { Proposal } from "@/types";

function formatPrice(cents: number | null) {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(0)} €`;
}

export default function ProposalsInboxScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: proposals = [], isLoading, error } = useProposalsInbox();
  const acceptProposal = useAcceptProposal();
  const rejectProposal = useRejectProposal();
  const pending = proposals.filter((p) => p.shipper_id === profile?.user_id && p.status === "pending");

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Screen>
        <EmptyState title="Erreur" subtitle={error.message} />
      </Screen>
    );
  }

  async function accept(id: string) {
    try {
      const res = await acceptProposal.mutateAsync(id);
      const shipmentId = res?.shipment?.id;
      if (shipmentId) router.push(`/shipments/${shipmentId}`);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Action impossible");
    }
  }

  async function reject(id: string) {
    try {
      await rejectProposal.mutateAsync(id);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Action impossible");
    }
  }

  return (
    <Screen noPadding>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Propositions reçues</Text>}
        ListEmptyComponent={<EmptyState title="Aucune proposition en attente" />}
        renderItem={({ item }: { item: Proposal }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Annonce #{item.listing_id.slice(0, 8)}</Text>
            <Text style={styles.cardPrice}>{formatPrice(item.price_cents)}</Text>
            {item.message ? <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text> : null}
            <View style={styles.actions}>
              <Button title="Accepter" onPress={() => accept(item.id)} disabled={acceptProposal.isPending} />
              <Button title="Refuser" onPress={() => reject(item.id)} variant="ghost" containerStyle={{ marginLeft: 12 }} disabled={rejectProposal.isPending} />
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#fafafa", marginBottom: 16 },
  card: {
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardTitle: { fontSize: 14, color: "#71717a", marginBottom: 4 },
  cardPrice: { fontSize: 18, fontWeight: "600", color: "#a78bfa", marginBottom: 8 },
  cardMsg: { fontSize: 14, color: "#d4d4d8", marginBottom: 12 },
  actions: { flexDirection: "row", alignItems: "center" },
});
