import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Listing } from "@/types";

type ListingCardProps = { listing: Listing };

function formatPrice(cents: number | null) {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(0)} €`;
}

export function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={() => router.push(`/listings/${listing.id}`)}>
      <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
      {(listing.origin_city || listing.destination_city) && (
        <Text style={styles.route} numberOfLines={1}>
          {[listing.origin_city, listing.destination_city].filter(Boolean).join(" → ")}
        </Text>
      )}
      <View style={styles.row}>
        {listing.weight_kg != null && <Text style={styles.meta}>{listing.weight_kg} kg</Text>}
        {listing.size_category && <Text style={styles.meta}>{listing.size_category}</Text>}
        <Text style={styles.price}>{formatPrice(listing.price_cents)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  title: { fontSize: 17, fontWeight: "600", color: "#fafafa", marginBottom: 6 },
  route: { fontSize: 14, color: "#a1a1aa", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  meta: { fontSize: 13, color: "#71717a" },
  price: { marginLeft: "auto", fontSize: 16, fontWeight: "600", color: "#a78bfa" },
});
