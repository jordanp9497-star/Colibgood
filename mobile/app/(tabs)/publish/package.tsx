import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "@/components/ui/Screen";
import { AddressInput } from "@/components/AddressInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileVerification } from "@/services/profileVerification";
import {
  createPackageListing,
  getPackageById,
  updatePackageListing,
  uploadPackageImage,
} from "@/services/packages";
import { COLS_SIZE_PRESETS } from "@/lib/colisSize";
import type { ColisSize } from "@/types";
import { colors, spacing, typography } from "@/theme";

const SIZES: { value: ColisSize; label: string }[] = [
  { value: "petit", label: "Petit" },
  { value: "moyen", label: "Moyen" },
  { value: "gros", label: "Grand" },
  { value: "special", label: "Colis spécial" },
];

export default function PublishPackageScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { userId } = useAuth();
  const isEditing = !!editId;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [size, setSize] = useState<ColisSize | null>(null);
  const [specialDescription, setSpecialDescription] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [errors, setErrors] = useState<{ from?: string; to?: string; size?: string; photo?: string }>({});

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setInitialLoading(true);
      const { data, error } = await getPackageById(editId);
      if (cancelled) return;
      if (error || !data) {
        Alert.alert("Erreur", error?.message ?? "Colis introuvable");
        router.back();
        return;
      }
      setFrom(data.from);
      setTo(data.to);
      setDeadline(new Date(data.deadline));
      setDescription(data.description ?? "");
      setImageUrl(data.image_url ?? null);
      const presetEntry = (Object.entries(COLS_SIZE_PRESETS) as [ColisSize, typeof COLS_SIZE_PRESETS[ColisSize]][])
        .find(([, preset]) =>
          preset.length === data.length &&
          preset.width === data.width &&
          preset.height === data.height &&
          preset.weight === data.weight
        );
      const inferredSize = presetEntry?.[0] ?? "special";
      setSize(inferredSize);
      if (inferredSize === "special") setSpecialDescription(data.content);
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

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez la caméra pour prendre une photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri ?? null);
    }
  }

  async function onSubmit() {
    const e: { from?: string; to?: string; size?: string; photo?: string } = {};
    if (!from.trim()) e.from = "Départ requis";
    if (!to.trim()) e.to = "Destination requise";
    if (!size) e.size = "Choisissez une taille";
    if (!photoUri && !imageUrl) e.photo = "Ajoutez au moins une photo";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!userId && !isEditing) return;
    if (!isEditing && verificationStatus !== "approved") {
      Alert.alert("Vérification requise", "Votre profil doit être vérifié pour publier un colis.");
      return;
    }
    if (!size) return;

    const preset = COLS_SIZE_PRESETS[size];
    const content =
      size === "special"
        ? specialDescription.trim() || "Colis spécial (électroménager, encombrant, etc.)"
        : `Taille ${size}`;

    setLoading(true);
    let finalImageUrl = imageUrl;
    if (photoUri && userId) {
      const { url, error: uploadError } = await uploadPackageImage(userId, photoUri);
      if (uploadError || !url) {
        setLoading(false);
        Alert.alert("Erreur", uploadError?.message ?? "Upload photo impossible");
        return;
      }
      finalImageUrl = url;
    }
    const payload = {
      from: from.trim(),
      to: to.trim(),
      deadline: deadline.toISOString().slice(0, 10),
      length: preset.length,
      width: preset.width,
      height: preset.height,
      weight: preset.weight,
      content,
      description: description.trim() || undefined,
      image_url: finalImageUrl ?? undefined,
    };
    const { data, error } = isEditing && editId
      ? await updatePackageListing(editId, payload)
      : await createPackageListing(userId ?? "", payload);
    setLoading(false);
    if (error) {
      Alert.alert("Erreur", error.message);
      return;
    }
    Alert.alert(
      isEditing ? "Colis modifié" : "Colis publié",
      isEditing ? "Votre colis a bien été mis à jour." : "Votre colis a bien été publié.",
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
          <Text style={styles.title}>{isEditing ? "Modifier un colis" : "Publier un colis"}</Text>

          <AddressInput
            label="Départ"
            placeholder="Ville ou adresse"
            value={from}
            onChangeText={(t) => { setFrom(t); setErrors((e) => ({ ...e, from: undefined })); }}
            error={errors.from}
          />
          <AddressInput
            label="Destination"
            placeholder="Ville ou adresse"
            value={to}
            onChangeText={(t) => { setTo(t); setErrors((e) => ({ ...e, to: undefined })); }}
            error={errors.to}
          />

          <Text style={styles.label}>Date limite de transport</Text>
          <Button
            variant="secondary"
            title={deadline.toLocaleDateString("fr-FR")}
            onPress={() => setShowPicker(true)}
          />
          {showPicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, d) => {
                setShowPicker(false);
                if (d) setDeadline(d);
              }}
            />
          )}

          <Text style={styles.label}>Taille du colis (comme Vinted)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.sizeRow}
          >
            {SIZES.map((s) => (
              <Button
                key={s.value}
                variant={size === s.value ? "primary" : "secondary"}
                title={s.value === "special" ? "Spécial" : s.label}
                onPress={() => setSize(s.value)}
                style={styles.sizeBtn}
              />
            ))}
          </ScrollView>
          {size === "special" && (
            <Input
              label="Colis spécial : précisez (électroménager, taille anormalement grande…)"
              placeholder="Ex. frigo, canapé, cartons volumineux"
              value={specialDescription}
              onChangeText={setSpecialDescription}
            />
          )}

          <Input
            label="Description du colis"
            placeholder="Décrivez brièvement le colis"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Photo du colis</Text>
          {photoUri || imageUrl ? (
            <Image source={{ uri: photoUri ?? imageUrl ?? undefined }} style={styles.photo} />
          ) : null}
          {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}
          <Button
            title={photoUri || imageUrl ? "Reprendre une photo" : "Prendre une photo"}
            variant="secondary"
            onPress={takePhoto}
          />

          {errors.size ? <Text style={styles.error}>{errors.size}</Text> : null}

          {verificationStatus !== "approved" ? (
            <Text style={styles.verifNotice}>
              Vérification requise pour publier un colis.
            </Text>
          ) : null}
          <Button
            title={isEditing ? "Enregistrer les modifications" : "Publier le colis"}
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
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
  sizeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  sizeBtn: { minWidth: 100 },
  error: { ...typography.footnote, color: colors.destructive, marginBottom: spacing.sm },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  verifNotice: { ...typography.footnote, color: colors.warning, marginTop: spacing.sm },
  cta: { marginTop: spacing.xl },
});
