import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSearchFlow } from "./_layout";
import { useAuth } from "@/contexts/AuthContext";
import { createProposal } from "@/services/proposals";
import { COLS_SIZE_PRICE_EUR, packageDraftFromSize } from "@/lib/colisSize";
import type { ColisSize } from "@/types";
import { colors, spacing, typography } from "@/theme";

const SIZES: { value: ColisSize; label: string }[] = [
  { value: "petit", label: "Petit" },
  { value: "moyen", label: "Moyen" },
  { value: "gros", label: "Grand" },
  { value: "special", label: "Colis spécial" },
];

export default function ColisScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { searchRequest, selectedTrip, clearSearchRequest } = useSearchFlow();
  const [size, setSize] = useState<ColisSize | null>(null);
  const [specialDescription, setSpecialDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchRequest || !selectedTrip) router.replace("/(tabs)/search");
  }, [searchRequest, selectedTrip, router]);

  const priceEur = size ? COLS_SIZE_PRICE_EUR[size] : 0;

  async function onPayAcompte() {
    if (!searchRequest || !selectedTrip || !size || !userId) return;
    setLoading(true);
    const priceCents = Math.round(priceEur * 100);
    const pkg = packageDraftFromSize(size, specialDescription || undefined);
    const { data, error } = await createProposal(userId, {
      from: searchRequest.from,
      to: searchRequest.to,
      datetime: searchRequest.datetime,
      package: pkg,
      price: priceCents,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Erreur", error.message);
      return;
    }
    clearSearchRequest();
    Alert.alert("Acompte enregistré", "Votre réservation et l'acompte ont bien été enregistrés.", [
      { text: "OK", onPress: () => router.replace("/(tabs)/trips") },
    ]);
  }

  if (!searchRequest || !selectedTrip) return null;

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Choisissez la taille du colis</Text>
        <Text style={styles.subtitle}>Comme sur Vinted : Petit, Moyen ou Grand. Colis spécial si électroménager ou très encombrant.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.sizeRow}
        >
          {SIZES.map((s) => (
            <Button
              key={s.value}
              variant={size === s.value ? "primary" : "secondary"}
              title={s.value === "special" ? "Spécial" : `${s.label} (${COLS_SIZE_PRICE_EUR[s.value]} €)`}
              onPress={() => setSize(s.value)}
              style={styles.sizeBtn}
            />
          ))}
        </ScrollView>

        {size === "special" && (
          <Input
            label="Précisez (électroménager, taille anormalement grande…)"
            placeholder="Ex. frigo, canapé, cartons volumineux"
            value={specialDescription}
            onChangeText={setSpecialDescription}
            style={styles.specialInput}
          />
        )}

        {priceEur > 0 && (
          <Card style={styles.priceCard}>
            <Text style={styles.priceLabel}>Acompte à payer</Text>
            <Text style={styles.priceValue}>{priceEur.toFixed(2)} €</Text>
          </Card>
        )}

        <Button
          title="Payer l'acompte"
          onPress={onPayAcompte}
          loading={loading}
          disabled={loading || !size}
          style={styles.cta}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title3, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.footnote, color: colors.textSecondary, marginBottom: spacing.lg },
  sizeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  sizeBtn: { minWidth: 100 },
  specialInput: { marginBottom: spacing.md },
  priceCard: { marginBottom: spacing.lg },
  priceLabel: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.xs },
  priceValue: { ...typography.title1, color: colors.primary },
  cta: { marginTop: spacing.sm },
});
