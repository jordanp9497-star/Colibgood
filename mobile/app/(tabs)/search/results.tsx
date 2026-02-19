import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSearchFlow } from "./_layout";
import type { TripSearchResult } from "@/types";
import { colors, spacing, typography } from "@/theme";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// TODO: remplacer par appels API
const MOCK_RESULTS: TripSearchResult[] = [
  { id: "t1", from: "Paris", to: "Lyon", datetime: new Date(Date.now() + 86400000).toISOString(), placesLeft: 2, priceBaseEur: 25 },
  { id: "t2", from: "Paris", to: "Lyon", datetime: new Date(Date.now() + 172800000).toISOString(), placesLeft: 1, priceBaseEur: 30 },
];

function TripResultCard({ trip, onPress }: { trip: TripSearchResult; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.routeInfo}>
            <View style={styles.cityRow}>
              <View style={styles.cityDot} />
              <Text style={styles.cityText}>{trip.from}</Text>
            </View>
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cityText}>{trip.to}</Text>
            </View>
          </View>
          <Text style={styles.price}>{trip.priceBaseEur} €</Text>
        </View>
        
        <View style={styles.cardDivider} />
        
        <View style={styles.cardFooter}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{formatDate(trip.datetime)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={16} color={colors.success} />
            <Text style={styles.infoText}>{trip.placesLeft} place{trip.placesLeft > 1 ? "s" : ""}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const { searchRequest, setSelectedTrip } = useSearchFlow();

  useEffect(() => {
    if (!searchRequest) router.replace("/(tabs)/search");
  }, [searchRequest, router]);

  function onSelectTrip(trip: TripSearchResult) {
    setSelectedTrip(trip);
    router.push("/(tabs)/search/reserve");
  }

  if (!searchRequest) return null;

  return (
    <Screen noPadding>
      <FlatList
        data={MOCK_RESULTS}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.routeRow}>
              <Text style={styles.routeText}>{searchRequest.from}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              <Text style={styles.routeText}>{searchRequest.to}</Text>
            </View>
            <Text style={styles.resultCount}>
              {MOCK_RESULTS.length} trajet{MOCK_RESULTS.length > 1 ? "s" : ""} disponible{MOCK_RESULTS.length > 1 ? "s" : ""}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun resultat</Text>
            <Text style={styles.emptySubtitle}>Essayez avec d'autres dates ou villes</Text>
            <Button 
              title="Modifier la recherche" 
              variant="secondary"
              onPress={() => router.back()}
              style={styles.emptyBtn}
            />
          </View>
        }
        renderItem={({ item }) => (
          <TripResultCard trip={item} onPress={() => onSelectTrip(item)} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: { paddingVertical: spacing.lg },
  routeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginBottom: spacing.xs },
  routeText: { ...typography.title2, color: colors.text },
  resultCount: { ...typography.subhead, color: colors.textSecondary, textAlign: "center" },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  routeInfo: { gap: spacing.sm, flex: 1 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  cityText: { ...typography.headline, color: colors.text },
  price: { ...typography.title2, color: colors.primary, fontWeight: "700" },
  cardDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  infoText: { ...typography.subhead, color: colors.textSecondary },
  emptyContainer: { alignItems: "center", paddingVertical: spacing.xxl },
  emptyTitle: { ...typography.title2, color: colors.text, marginTop: spacing.lg },
  emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  emptyBtn: { marginTop: spacing.lg },
});
