import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AddressInput } from "@/components/AddressInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSearchFlow } from "./_layout";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacing, typography } from "@/theme";

const defaultDate = () => {
  const d = new Date();
  d.setHours(7, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};

export default function SearchScreen() {
  const router = useRouter();
  const { setSearchRequest } = useSearchFlow();
  const { profile } = useAuth();
  const isDriver = profile?.role === "driver";
  
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [datetime, setDatetime] = useState(defaultDate());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<"driver" | "shipper">(isDriver ? "driver" : "shipper");
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});

  function validate(): boolean {
    const e: { from?: string; to?: string } = {};
    if (!from.trim()) e.from = "Ville de depart requise";
    if (!to.trim()) e.to = "Ville d'arrivee requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSearch() {
    if (!validate()) return;
    setSearchRequest({
      from: from.trim(),
      to: to.trim(),
      datetime: datetime.toISOString(),
    });
    router.push("/(tabs)/search/results");
  }

  function onPublish() {
    if (mode === "driver") {
      router.push("/(tabs)/trips/create");
    } else {
      router.push("/(tabs)/listings/create");
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {mode === "driver" ? "Proposez vos trajets" : "Envoyez votre colis"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "driver" 
              ? "Gagnez de l'argent en partageant vos places" 
              : "Trouvez un transport pour votre colis"}
          </Text>

          <View style={styles.modeToggle}>
            <Button
              title="Je suis conducteur"
              variant={mode === "driver" ? "primary" : "secondary"}
              onPress={() => setMode("driver")}
              style={styles.modeBtn}
            />
            <Button
              title="J'expedie"
              variant={mode === "shipper" ? "primary" : "secondary"}
              onPress={() => setMode("shipper")}
              style={styles.modeBtn}
            />
          </View>

          <Card style={styles.searchCard}>
            <AddressInput
              label="Depart"
              placeholder="Ville de depart"
              value={from}
              onChangeText={(t) => {
                setFrom(t);
                setErrors((e) => ({ ...e, from: undefined }));
              }}
              error={errors.from}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>

            <AddressInput
              label="Arrivee"
              placeholder="Ville d'arrivee"
              value={to}
              onChangeText={(t) => {
                setTo(t);
                setErrors((e) => ({ ...e, to: undefined }));
              }}
              error={errors.to}
            />

            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>
                {mode === "driver" ? "Date de depart" : "Date souhaitee"}
              </Text>
              <Button
                variant="secondary"
                title={datetime.toLocaleDateString("fr-FR", { 
                  weekday: "long",
                  day: "numeric", 
                  month: "long"
                })}
                onPress={() => setShowPicker(true)}
              />
              {showPicker && (
                <DateTimePicker
                  value={datetime}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, d) => {
                    setShowPicker(false);
                    if (d) setDatetime(d);
                  }}
                />
              )}
            </View>

            <Button
              title={mode === "driver" ? "Rechercher des colis" : "Rechercher des trajets"}
              onPress={onSearch}
              style={styles.searchBtn}
            />
          </Card>

          <Button
            title={mode === "driver" ? "Publier un trajet" : "Publier une annonce"}
            variant="secondary"
            onPress={onPublish}
            style={styles.publishBtn}
          />

          {mode === "driver" && (
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Comment ca marche ?</Text>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.infoText}>Publiez votre trajet avec les dates</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.infoText}>Acceptez les colis qui vous interessent</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.infoText}>Echangez et partagez les frais</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title1, color: colors.text, marginTop: spacing.md },
  subtitle: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  modeToggle: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  modeBtn: { flex: 1 },
  searchCard: { padding: spacing.lg, marginBottom: spacing.lg },
  divider: { alignItems: "center", paddingVertical: spacing.sm },
  dividerLine: { width: 2, height: 24, backgroundColor: colors.border, borderRadius: 1 },
  dateSection: { marginTop: spacing.md },
  dateLabel: { ...typography.caption1, color: colors.textSecondary, marginBottom: spacing.xs },
  searchBtn: { marginTop: spacing.lg },
  publishBtn: { marginBottom: spacing.lg },
  infoSection: { marginTop: spacing.md },
  infoTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.sm },
  infoItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  infoText: { ...typography.subhead, color: colors.textSecondary, flex: 1 },
});
