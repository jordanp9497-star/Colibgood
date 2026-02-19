import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { useSearchFlow } from "./_layout";
import { colors, spacing, typography } from "@/theme";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ReserveScreen() {
  const router = useRouter();
  const { searchRequest, selectedTrip } = useSearchFlow();

  useEffect(() => {
    if (!searchRequest || !selectedTrip) router.replace("/(tabs)/search");
  }, [searchRequest, selectedTrip, router]);

  function onReserve() {
    router.push("/(tabs)/search/colis");
  }

  if (!searchRequest || !selectedTrip) return null;

  return (
    <Screen>
      <Text style={styles.route}>{selectedTrip.from} → {selectedTrip.to}</Text>
      <Text style={styles.meta}>{formatDate(selectedTrip.datetime)} · {selectedTrip.placesLeft} place(s) restante(s)</Text>
      <Text style={styles.ctaLabel}>Réservez une place pour ce trajet. Vous préciserez le colis à l’étape suivante.</Text>
      <Button title="Réserver une place" onPress={onReserve} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  route: { ...typography.title3, color: colors.text, marginBottom: spacing.xs },
  meta: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.xl },
  ctaLabel: { ...typography.body, color: colors.text, marginBottom: spacing.lg },
  cta: { marginTop: spacing.sm },
});
