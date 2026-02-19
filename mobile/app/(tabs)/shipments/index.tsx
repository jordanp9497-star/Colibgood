import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useShipments } from "@/hooks/useShipments";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Shipment } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  created: "Créée",
  pickup_scheduled: "Enlèvement prévu",
  picked_up: "Enlevé",
  in_transit: "En transit",
  delivered: "Livré",
  disputed: "Litige",
  cancelled: "Annulé",
};

export default function ShipmentsListScreen() {
  const router = useRouter();
  const { data: shipments, isLoading, error } = useShipments();

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Screen>
        <EmptyState title="Erreur" subtitle={error.message} />
      </Screen>
    );
  }

  return (
    <Screen noPadding>
      <FlatList
        data={shipments ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Mes expéditions</Text>}
        ListEmptyComponent={<EmptyState title="Aucune expédition" />}
        renderItem={({ item }: { item: Shipment }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/shipments/${item.id}`)}>
            <Text style={styles.cardId}>#{item.id.slice(0, 8)}</Text>
            <Text style={styles.cardStatus}>{STATUS_LABELS[item.status] ?? item.status}</Text>
          </Pressable>
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
  cardId: { fontSize: 14, color: "#71717a", marginBottom: 4 },
  cardStatus: { fontSize: 16, fontWeight: "600", color: "#fafafa" },
});
