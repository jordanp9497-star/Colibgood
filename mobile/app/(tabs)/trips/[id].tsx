import { Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTrip, useDeleteTrip } from "@/hooks/useTrips";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading, error } = useTrip(id);
  const del = useDeleteTrip(id ?? "");

  async function onDelete() {
    if (!id) return;
    Alert.alert("Supprimer le trajet", "Confirmez-vous la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await del.mutateAsync();
            router.replace("/(tabs)/trips");
          } catch (e) {
            Alert.alert("Erreur", e instanceof Error ? e.message : "Suppression impossible");
          }
        },
      },
    ]);
  }

  if (isLoading) return <Loader />;
  if (error || !trip) {
    return (
      <Screen>
        <EmptyState title="Trajet introuvable" subtitle={error?.message} />
        <Button title="Retour" variant="secondary" onPress={() => router.back()} containerStyle={{ marginTop: 12 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Trajet</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Trajet</Text>
        <Text style={styles.value}>
          {[trip.origin_city, trip.destination_city].filter(Boolean).join(" → ") || "—"}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Départ</Text>
        <Text style={styles.value}>{formatDate(trip.depart_datetime)}</Text>
      </View>
      {trip.capacity_kg != null ? (
        <View style={styles.row}>
          <Text style={styles.label}>Capacité</Text>
          <Text style={styles.value}>{trip.capacity_kg} kg</Text>
        </View>
      ) : null}
      {trip.notes ? (
        <View style={styles.row}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{trip.notes}</Text>
        </View>
      ) : null}

      <Button title="Modifier" variant="secondary" onPress={() => router.push(`/(tabs)/trips/create?editId=${trip.id}`)} containerStyle={{ marginTop: 24 }} />
      <Button title="Supprimer" variant="destructive" onPress={onDelete} disabled={del.isPending} containerStyle={{ marginTop: 12 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: "#fafafa", marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 12 },
  label: { fontSize: 14, color: "#71717a", width: 80 },
  value: { fontSize: 15, color: "#fafafa", flex: 1 },
});
