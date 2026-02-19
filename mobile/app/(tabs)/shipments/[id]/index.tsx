import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useShipment, useShipmentEvents, useUpdateShipmentStatus } from "@/hooks/useShipments";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { ShipmentEvent } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  created: "Créée",
  pickup_scheduled: "Enlèvement prévu",
  picked_up: "Enlevé",
  in_transit: "En transit",
  delivered: "Livré",
  disputed: "Litige",
  cancelled: "Annulé",
};

const NEXT_STATUS: Record<string, string> = {
  created: "pickup_scheduled",
  pickup_scheduled: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: shipment, isLoading, error } = useShipment(id);
  const { data: events = [] } = useShipmentEvents(id);
  const updateStatus = useUpdateShipmentStatus(id ?? "");
  const isDriver = profile?.role === "driver";
  const canAdvance = isDriver && shipment && NEXT_STATUS[shipment.status];

  async function advanceStatus() {
    if (!shipment || !NEXT_STATUS[shipment.status]) return;
    try {
      await updateStatus.mutateAsync(NEXT_STATUS[shipment.status]);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Mise à jour impossible");
    }
  }

  if (isLoading) return <Loader />;
  if (error || !shipment) {
    return (
      <Screen>
        <EmptyState title="Expédition introuvable" subtitle={error?.message} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Expédition #{shipment.id.slice(0, 8)}</Text>
      <Text style={styles.status}>{STATUS_LABELS[shipment.status] ?? shipment.status}</Text>

      {canAdvance && (
        <Button
          title={`Passer à ${STATUS_LABELS[NEXT_STATUS[shipment.status]] ?? NEXT_STATUS[shipment.status]}`}
          onPress={advanceStatus}
          disabled={updateStatus.isPending}
          containerStyle={{ marginTop: 16, marginBottom: 24 }}
        />
      )}

      <Text style={styles.section}>Historique</Text>
      <ScrollView style={styles.timeline} nestedScrollEnabled>
        {(events as ShipmentEvent[]).map((ev) => (
          <View key={ev.id} style={styles.event}>
            <Text style={styles.eventType}>{ev.type}</Text>
            <Text style={styles.eventDate}>{new Date(ev.created_at).toLocaleString()}</Text>
          </View>
        ))}
        {events.length === 0 && <Text style={styles.noEvents}>Aucun événement</Text>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: "#fafafa", marginBottom: 4 },
  status: { fontSize: 16, color: "#a78bfa", marginBottom: 8 },
  section: { fontSize: 18, fontWeight: "600", color: "#fafafa", marginTop: 24, marginBottom: 12 },
  timeline: { maxHeight: 300 },
  event: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#27272a" },
  eventType: { fontSize: 15, fontWeight: "500", color: "#fafafa" },
  eventDate: { fontSize: 13, color: "#71717a", marginTop: 2 },
  noEvents: { fontSize: 14, color: "#71717a" },
});
