import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useListing } from "@/hooks/useListings";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

function formatPrice(cents: number | null) {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)} €`;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { data: listing, isLoading, error } = useListing(id);
  const isShipper = profile?.role === "shipper";
  const canPropose = !isShipper && listing?.status === "active";

  if (isLoading) return <Loader />;
  if (error || !listing) {
    return (
      <Screen>
        <EmptyState title="Annonce introuvable" subtitle={error?.message} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.status}>Statut : {listing.status}</Text>
      {listing.description ? <Text style={styles.desc}>{listing.description}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.label}>Trajet</Text>
        <Text style={styles.value}>
          {[listing.origin_city, listing.destination_city].filter(Boolean).join(" → ") || "—"}
        </Text>
      </View>
      {listing.weight_kg != null && (
        <View style={styles.row}>
          <Text style={styles.label}>Poids</Text>
          <Text style={styles.value}>{listing.weight_kg} kg</Text>
        </View>
      )}
      {listing.size_category && (
        <View style={styles.row}>
          <Text style={styles.label}>Taille</Text>
          <Text style={styles.value}>{listing.size_category}</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.label}>Prix</Text>
        <Text style={styles.price}>{formatPrice(listing.price_cents)}</Text>
      </View>
      {canPropose && (
        <Button
          title="Proposer"
          onPress={() => router.push(`/listings/${id}/propose`)}
          containerStyle={{ marginTop: 24 }}
        />
      )}
      {isShipper && (
        <Button
          title="Voir les propositions reçues"
          variant="secondary"
          onPress={() => router.push("/(tabs)/profile/proposals-inbox")}
          containerStyle={{ marginTop: 16 }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: "#fafafa", marginBottom: 12 },
  status: { fontSize: 13, color: "#71717a", marginBottom: 10 },
  desc: { fontSize: 15, color: "#d4d4d8", marginBottom: 20 },
  row: { flexDirection: "row", marginBottom: 12 },
  label: { fontSize: 14, color: "#71717a", width: 80 },
  value: { fontSize: 15, color: "#fafafa", flex: 1 },
  price: { fontSize: 18, fontWeight: "600", color: "#a78bfa" },
});
