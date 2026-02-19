import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import {
  getProfileVerification,
  submitProfileVerification,
  uploadVerificationDoc,
  type ProfileVerification,
} from "@/services/profileVerification";
import { colors, spacing, typography } from "@/theme";

export default function ProfileScreen() {
  const { userEmail, signOut, userId, profile } = useAuth();
  const router = useRouter();
  const [verification, setVerification] = useState<ProfileVerification | null>(null);
  const [idDocUri, setIdDocUri] = useState<string | null>(null);
  const [vehicleDocUri, setVehicleDocUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await getProfileVerification(userId);
      setVerification(data);
    })();
  }, [userId]);

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  async function takePhoto(type: "id" | "vehicle") {
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
      const uri = result.assets[0]?.uri ?? null;
      if (type === "id") setIdDocUri(uri);
      else setVehicleDocUri(uri);
    }
  }

  async function submitVerification() {
    if (!userId || !profile?.role) return;
    if (!idDocUri && !verification?.id_doc_url) {
      Alert.alert("Pièce d'identité requise", "Ajoutez une photo de votre pièce d'identité.");
      return;
    }
    if (profile.role === "driver" && !vehicleDocUri && !verification?.vehicle_doc_url) {
      Alert.alert("Carte grise requise", "Ajoutez une photo de la carte grise du véhicule.");
      return;
    }
    setLoading(true);
    let idUrl = verification?.id_doc_url ?? null;
    let vehicleUrl = verification?.vehicle_doc_url ?? null;
    if (idDocUri) {
      const { url, error } = await uploadVerificationDoc(userId, "id", idDocUri);
      if (error || !url) {
        setLoading(false);
        Alert.alert("Erreur", error?.message ?? "Upload pièce d'identité impossible");
        return;
      }
      idUrl = url;
    }
    if (profile.role === "driver" && vehicleDocUri) {
      const { url, error } = await uploadVerificationDoc(userId, "vehicle", vehicleDocUri);
      if (error || !url) {
        setLoading(false);
        Alert.alert("Erreur", error?.message ?? "Upload carte grise impossible");
        return;
      }
      vehicleUrl = url;
    }
    const { data, error } = await submitProfileVerification({
      user_id: userId,
      role: profile.role,
      status: "pending",
      id_doc_url: idUrl,
      vehicle_doc_url: vehicleUrl,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Erreur", error.message);
      return;
    }
    setVerification(data);
    Alert.alert("Demande envoyée", "Votre vérification est en cours.");
  }

  const statusLabel =
    verification?.status === "approved"
      ? "Vérifié"
      : verification?.status === "rejected"
        ? "Refusé"
        : verification?.status === "pending"
          ? "En attente"
          : "Non vérifié";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={true}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userEmail ?? "—"}</Text>
        <View style={styles.verifCard}>
          <View style={styles.verifHeader}>
            <Text style={styles.sectionTitle}>Vérification</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.helper}>
            {profile?.role === "driver"
              ? "Prenez une photo de votre piece d'identite puis de la carte grise."
              : "Prenez une photo de votre piece d'identite."
            }
          </Text>

          <Text style={styles.label}>Piece d'identite</Text>
          {idDocUri || verification?.id_doc_url ? (
            <Image source={{ uri: idDocUri ?? verification?.id_doc_url ?? undefined }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoHint}>Aucune photo ajoutee</Text>
            </View>
          )}
          <Button
            title={idDocUri || verification?.id_doc_url ? "Reprendre la photo" : "Prendre une photo"}
            variant="secondary"
            onPress={() => takePhoto("id")}
            style={styles.linkBtn}
          />

          {profile?.role === "driver" && (
            <>
              <Text style={styles.label}>Carte grise</Text>
              {vehicleDocUri || verification?.vehicle_doc_url ? (
                <Image source={{ uri: vehicleDocUri ?? verification?.vehicle_doc_url ?? undefined }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoHint}>Aucune photo ajoutee</Text>
                </View>
              )}
              <Button
                title={vehicleDocUri || verification?.vehicle_doc_url ? "Reprendre la photo" : "Prendre une photo"}
                variant="secondary"
                onPress={() => takePhoto("vehicle")}
                style={styles.linkBtn}
              />
            </>
          )}

          <Button
            title={loading ? "Envoi…" : "Envoyer la demande"}
            onPress={submitVerification}
            disabled={loading}
            style={styles.linkBtn}
          />
        </View>
        <Button title="Notifications" variant="secondary" onPress={() => router.push("/(tabs)/profile/notifications")} style={styles.linkBtn} />
        {profile?.role === "admin" ? (
          <Button
            title="Valider les documents"
            variant="secondary"
            onPress={() => router.push("/(tabs)/profile/verification-admin")}
            style={styles.linkBtn}
          />
        ) : profile?.role === "shipper" ? (
          <>
            <Button title="Mes annonces" variant="secondary" onPress={() => router.push("/(tabs)/listings")} style={styles.linkBtn} />
            <Button
              title="Propositions reçues"
              variant="secondary"
              onPress={() => router.push("/(tabs)/profile/proposals-inbox")}
              style={styles.linkBtn}
            />
            <Button title="Mes expéditions" variant="secondary" onPress={() => router.push("/(tabs)/shipments")} style={styles.linkBtn} />
          </>
        ) : (
          <>
            <Button title="Annonces disponibles" variant="secondary" onPress={() => router.push("/(tabs)/listings")} style={styles.linkBtn} />
            <Button title="Mes expéditions" variant="secondary" onPress={() => router.push("/(tabs)/shipments")} style={styles.linkBtn} />
            <Button title="Mes trajets" variant="secondary" onPress={() => router.push("/(tabs)/trips")} style={styles.linkBtn} />
          </>
        )}
        <Button
          title="Se déconnecter"
          onPress={handleSignOut}
          variant="destructive"
          style={styles.logout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  title: { ...typography.title1, color: colors.text, marginBottom: spacing.lg },
  sectionTitle: { ...typography.headline, color: colors.text },
  label: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.xs },
  value: { ...typography.body, color: colors.text, marginBottom: spacing.lg },
  linkBtn: { marginBottom: spacing.md },
  logout: { marginTop: spacing.xl },
  helper: { ...typography.footnote, color: colors.textSecondary, marginBottom: spacing.md },
  verifCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  verifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { ...typography.caption1, color: colors.text },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  photoPlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  photoHint: { ...typography.footnote, color: colors.textSecondary },
});
