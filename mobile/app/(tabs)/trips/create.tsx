import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { useCreateTrip, useTrip, useUpdateTrip } from "@/hooks/useTrips";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileVerification } from "@/services/profileVerification";
import { reverseGeocode } from "@/lib/geocode";
import { colors, spacing, typography } from "@/theme";

function defaultDate() {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

export default function TripCreateScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;
  const { userId, profile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "approved" | "rejected" | null>(null);

  const { data: existing, isLoading: loadingExisting } = useTrip(isEditing ? editId : undefined);
  const create = useCreateTrip();
  const update = useUpdateTrip(editId ?? "");

  const [originCity, setOriginCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [departDate, setDepartDate] = useState<Date>(defaultDate);
  const [showPicker, setShowPicker] = useState(false);
  const [capacityKg, setCapacityKg] = useState("");
  const [notes, setNotes] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [errors, setErrors] = useState<{ origin?: string; destination?: string }>({});

  const busy = create.isPending || update.isPending;
  const requiresVerification = profile?.role === "driver";
  const isVerified = !requiresVerification || verificationStatus === "approved";

  useEffect(() => {
    if (!requiresVerification || !userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await getProfileVerification(userId);
      if (!cancelled) setVerificationStatus(data?.status ?? null);
    })();
    return () => { cancelled = true; };
  }, [requiresVerification, userId]);

  useEffect(() => {
    if (!isEditing || !existing) return;
    setOriginCity(existing.origin_city ?? "");
    setDestinationCity(existing.destination_city ?? "");
    setDepartDate(existing.depart_datetime ? new Date(existing.depart_datetime) : defaultDate());
    setCapacityKg(existing.capacity_kg != null ? String(existing.capacity_kg) : "");
    setNotes(existing.notes ?? "");
  }, [isEditing, existing]);

  async function useMyLocation() {
    setLocationLoading(true);
    setErrors((e) => ({ ...e, origin: undefined }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusee", "Autorisez la localisation.");
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const address = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      setOriginCity(address);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'obtenir la position.");
    } finally {
      setLocationLoading(false);
    }
  }

  function validate(): boolean {
    const e: { origin?: string; destination?: string } = {};
    if (!originCity.trim()) e.origin = "Ville de depart requise";
    if (!destinationCity.trim()) e.destination = "Ville d'arrivee requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!isVerified) {
      Alert.alert("Verification requise", "Votre profil doit etre verifie pour publier un trajet.");
      return;
    }
    if (!validate()) return;

    const payload = {
      origin_city: originCity.trim(),
      destination_city: destinationCity.trim(),
      depart_datetime: departDate.toISOString(),
      capacity_kg: capacityKg ? Number(capacityKg) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEditing && editId) {
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }
      router.replace("/(tabs)/trips");
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Enregistrement impossible");
    }
  }

  if (isEditing && loadingExisting) return <Loader />;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isEditing ? "Modifier le trajet" : "Publier un trajet"}</Text>
          
          <Card style={styles.formCard}>
            <Input 
              placeholder="Ville de depart *" 
              value={originCity} 
              onChangeText={(t) => { setOriginCity(t); setErrors((e) => ({ ...e, origin: undefined })); }} 
              error={errors.origin}
              rightLabel={locationLoading ? undefined : "Ma position"}
              onRightLabelPress={useMyLocation}
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>
            
            <Input 
              placeholder="Ville d'arrivee *" 
              value={destinationCity} 
              onChangeText={(t) => { setDestinationCity(t); setErrors((e) => ({ ...e, destination: undefined })); }} 
              error={errors.destination}
            />

            <View style={styles.dateSection}>
              <Text style={styles.label}>Date de depart</Text>
              <Button
                variant="secondary"
                title={departDate.toLocaleDateString("fr-FR", { 
                  weekday: "long",
                  day: "numeric", 
                  month: "long"
                })}
                onPress={() => setShowPicker(true)}
              />
              {showPicker && (
                <DateTimePicker
                  value={departDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, d) => {
                    setShowPicker(false);
                    if (d) setDepartDate(d);
                  }}
                />
              )}
            </View>
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Capacite</Text>
            <Input 
              placeholder="Capacite en kg (optionnel)" 
              value={capacityKg} 
              onChangeText={setCapacityKg} 
              keyboardType="decimal-pad" 
            />
            <Text style={styles.hint}>Indiquez la capacite disponible pour les colis</Text>

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Notes</Text>
            <Input 
              placeholder="Informations supplementaires (optionnel)" 
              value={notes} 
              onChangeText={setNotes} 
              multiline 
              numberOfLines={3}
            />
          </Card>

          {requiresVerification && !isVerified ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Verification requise (statut: {verificationStatus ?? "non verifie"})
              </Text>
              <Button
                title="Verifier mon profil"
                variant="secondary"
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.warningBtn}
              />
            </View>
          ) : (
            <Button
              title={busy ? "Enregistrement..." : (isEditing ? "Enregistrer" : "Publier le trajet")}
              onPress={submit}
              disabled={busy || !isVerified}
              style={styles.submitBtn}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title1, color: colors.text, marginTop: spacing.md, marginBottom: spacing.lg },
  formCard: { padding: spacing.lg, marginBottom: spacing.lg },
  divider: { alignItems: "center", paddingVertical: spacing.sm },
  dividerLine: { width: 2, height: 24, backgroundColor: colors.border, borderRadius: 1 },
  dateSection: { marginTop: spacing.md },
  label: { ...typography.caption1, color: colors.textSecondary, marginBottom: spacing.xs },
  sectionTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.sm },
  hint: { ...typography.footnote, color: colors.textSecondary, marginTop: -spacing.xs },
  warningBox: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, borderWidth: 1, borderColor: colors.warning },
  warningText: { ...typography.subhead, color: colors.warning, marginBottom: spacing.md },
  warningBtn: { marginTop: spacing.sm },
  submitBtn: { marginTop: spacing.md },
});
