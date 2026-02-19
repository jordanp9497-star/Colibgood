import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTrips } from "@/hooks/useTrips";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Trip } from "@/types";
import { colors, spacing, typography } from "@/theme";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "Date a confirmer";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return String(iso);
  }
}

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const origin = trip.origin_city || trip.from_place || "Depart";
  const destination = trip.destination_city || trip.to_place || "Arrivee";
  
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.routeContainer}>
          <View style={styles.cityDot} />
          <Text style={styles.routeText}>{origin}</Text>
        </View>
        <View style={styles.routeContainer}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.routeText}>{destination}</Text>
        </View>
      </View>
      
      <View style={styles.cardDivider} />
      
      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.dateText}>{formatDate(trip.depart_datetime)}</Text>
        </View>
        {trip.capacity_kg != null && (
          <View style={styles.capacityContainer}>
            <Ionicons name="cube-outline" size={16} color={colors.success} />
            <Text style={styles.capacityText}> hasta {trip.capacity_kg} kg</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function TripsIndexScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useTrips({ limit: 50, offset: 0 });
  const trips = data?.data ?? [];

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
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Mes trajets</Text>
            <Text style={styles.subtitle}>Gerez vos trajets et vos reservations</Text>
            <Button 
              title="+ Nouveau trajet" 
              onPress={() => router.push("/(tabs)/trips/create")} 
              containerStyle={styles.createBtn} 
            />
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-sport-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun trajet</Text>
            <Text style={styles.emptySubtitle}>Publiez votre premier trajet pour commencer a transporter des colis</Text>
            <Button 
              title="Publier un trajet" 
              onPress={() => router.push("/(tabs)/trips/create")} 
              style={styles.emptyBtn}
            />
          </View>
        }
        renderItem={({ item }: { item: Trip }) => (
          <TripCard 
            trip={item} 
            onPress={() => router.push(`/trips/${item.id}`)} 
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title1, color: colors.text, marginTop: spacing.md },
  subtitle: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  createBtn: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    gap: spacing.sm,
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  routeText: { ...typography.headline, color: colors.text },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: { ...typography.subhead, color: colors.text },
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  capacityText: { ...typography.subhead, color: colors.textSecondary },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: { ...typography.title2, color: colors.text, marginTop: spacing.lg },
  emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  emptyBtn: { marginTop: spacing.lg },
});
