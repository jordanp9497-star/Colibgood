import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { Screen } from "@/components/ui/Screen";
import { AddressInput } from "@/components/AddressInput";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileVerification } from "@/services/profileVerification";
import { createTrip, getTripById, updateTrip } from "@/services/trips";
import { reverseGeocode } from "@/lib/geocode";
import type { VehicleType } from "@/types";
import { colors, spacing, typography } from "@/theme";

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: "voiture", label: "Voiture" },
  { value: "van", label: "Van" },
  { value: "utilitaire", label: "Utilitaire" },
  { value: "camionnette", label: "Camionnette" },
];

export default function PublishTripScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { userId, profile } = useAuth();
  const isEditing = !!editId;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [datetime, setDatetime] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("voiture");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setInitialLoading(true);
      const { data, error } = await getTripById(editId);
      if (cancelled) return;
      if (error || !data) {
        Alert.alert("Erreur", error?.message ?? "Trajet introuvable");
        router.back();
        return;
      }
      setFrom(data.from);
      setTo(data.to);
      setDatetime(new Date(data.datetime));
      setVehicleType(data.vehicle_type);
      setInitialLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, router]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await getProfileVerification(userId);
      setVerificationStatus(data?.status ?? null);
    })();
  }, [userId]);

  async function useMyLocation() {
    setLocationLoading(true);
    setErrors((e) => ({ ...e, from: undefined }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Autorisez la localisation pour utiliser votre position au départ.");
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const address = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      setFrom(address);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'obtenir la position. Vérifiez le GPS.");
    } finally {
      setLocationLoading(false);
    }
  }

  async function onSubmit() {
    const e: { from?: string; to?: string } = {};
    if (!from.trim()) e.from = "Départ requis";
    if (!to.trim()) e.to = "Destination requise";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!userId && !isEditing) return;
    if (!isEditing && profile?.role === "driver" && verificationStatus !== "approved") {
      Alert.alert("Vérification requise", "Votre profil doit être vérifié pour publier un trajet.");
      return;
    }

    setLoading(true);
    const payload = {
      from: from.trim(),
      to: to.trim(),
      datetime: datetime.toISOString(),
      vehicle_type: vehicleType,
    };
    const { data, error } = isEditing && editId
      ? await updateTrip(editId, payload)
      : await createTrip(userId ?? "", payload);
    setLoading(false);
    if (error) {
      Alert.alert("Erreur", error.message);
      return;
    }
    Alert.alert(
      isEditing ? "Trajet modifié" : "Trajet publié",
      isEditing ? "Votre trajet a bien été mis à jour." : "Votre trajet a bien été publié.",
      [{ text: "OK", onPress: () => router.replace("/(tabs)/trips") }]
    );
  }

  if (initialLoading) return <Loader />;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{isEditing ? "Modifier un trajet" : "Publier un trajet"}</Text>

          <AddressInput
            label="Départ"
            placeholder="Ville ou adresse"
            value={from}
            onChangeText={(t) => {
              setFrom(t);
              setErrors((e) => ({ ...e, from: undefined }));
            }}
            error={errors.from}
            rightButton={{
              label: "Ma position",
              onPress: useMyLocation,
              loading: locationLoading,
            }}
          />
          <AddressInput
            label="Destination"
            placeholder="Ville ou adresse"
            value={to}
            onChangeText={(t) => {
              setTo(t);
              setErrors((e) => ({ ...e, to: undefined }));
            }}
            error={errors.to}
          />

          <Text style={styles.label}>Date et heure</Text>
          <Button
            variant="secondary"
            title={datetime.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
            onPress={() => setShowPicker(true)}
          />
          {showPicker && (
            <DateTimePicker
              value={datetime}
              mode="datetime"
              minimumDate={new Date()}
              onChange={(_, d) => {
                setShowPicker(false);
                if (d) setDatetime(d);
              }}
            />
          )}

          <Text style={styles.label}>Type de véhicule</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.vehicleRow}
          >
            {VEHICLE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={vehicleType === opt.value ? "primary" : "secondary"}
                title={opt.label}
                onPress={() => setVehicleType(opt.value)}
                style={styles.vehicleBtn}
              />
            ))}
          </ScrollView>

          {profile?.role === "driver" && verificationStatus !== "approved" ? (
            <Text style={styles.verifNotice}>
              Vérification requise pour publier un trajet.
            </Text>
          ) : null}
          <Button
            title={isEditing ? "Enregistrer les modifications" : "Publier le trajet"}
            onPress={onSubmit}
            loading={loading}
            style={styles.cta}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title2, color: colors.text, marginBottom: spacing.lg },
  label: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  vehicleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  vehicleBtn: { minWidth: 100 },
  verifNotice: { ...typography.footnote, color: colors.warning, marginTop: spacing.sm },
  cta: { marginTop: spacing.xl },
});
