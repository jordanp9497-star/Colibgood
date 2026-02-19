import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  listPendingVerifications,
  updateVerificationStatus,
  type ProfileVerification,
  type VerificationStatus,
} from "@/services/profileVerification";
import { colors, spacing, typography } from "@/theme";

type PendingRow = ProfileVerification;

export default function VerificationAdminScreen() {
  const { profile } = useAuth();
  const [items, setItems] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await listPendingVerifications("driver");
    setLoading(false);
    if (error) {
      Alert.alert("Erreur", error.message);
      return;
    }
    setItems(data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(userId: string, status: VerificationStatus) {
    setUpdatingId(userId);
    const { data, error } = await updateVerificationStatus(userId, status);
    setUpdatingId(null);
    if (error || !data) {
      Alert.alert("Erreur", error?.message ?? "Mise a jour impossible");
      return;
    }
    setItems((prev) => prev.filter((row) => row.user_id !== userId));
  }

  if (profile?.role !== "admin") {
    return (
      <Screen>
        <View style={styles.stateWrap}>
          <Text style={styles.title}>Acces reserve</Text>
          <Text style={styles.helper}>Cette page est reservee aux comptes administrateur.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={true}>
        <Text style={styles.title}>Validation documents</Text>
        <Text style={styles.helper}>Verifiez les pieces des conducteurs avant publication.</Text>

        <Button
          title={loading ? "Actualisation…" : "Actualiser"}
          variant="secondary"
          onPress={load}
          disabled={loading}
          style={styles.refresh}
        />

        {items.length === 0 ? (
          <Text style={styles.empty}>Aucune demande en attente.</Text>
        ) : (
          items.map((item) => (
            <Card key={item.user_id} style={styles.card}>
              <Text style={styles.cardTitle}>Utilisateur</Text>
              <Text style={styles.meta}>{item.user_id}</Text>
              <Text style={styles.metaSmall}>Role: {item.role}</Text>
              <Text style={styles.metaSmall}>Statut: {item.status}</Text>

              <Text style={styles.sectionLabel}>Piece d'identite</Text>
              {item.id_doc_url ? (
                <Image source={{ uri: item.id_doc_url }} style={styles.photo} />
              ) : (
                <Text style={styles.muted}>Aucune piece fournie.</Text>
              )}

              <Text style={styles.sectionLabel}>Carte grise</Text>
              {item.vehicle_doc_url ? (
                <Image source={{ uri: item.vehicle_doc_url }} style={styles.photo} />
              ) : (
                <Text style={styles.muted}>Aucune carte grise fournie.</Text>
              )}

              <View style={styles.actions}>
                <Button
                  title="Approuver"
                  onPress={() => setStatus(item.user_id, "approved")}
                  disabled={updatingId === item.user_id}
                  style={styles.actionBtn}
                />
                <Button
                  title="Refuser"
                  variant="destructive"
                  onPress={() => setStatus(item.user_id, "rejected")}
                  disabled={updatingId === item.user_id}
                  style={styles.actionBtn}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  title: { ...typography.title1, color: colors.text, marginBottom: spacing.sm },
  helper: { ...typography.footnote, color: colors.textSecondary, marginBottom: spacing.md },
  refresh: { marginBottom: spacing.lg },
  empty: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.md },
  card: { marginBottom: spacing.lg },
  cardTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.xs },
  meta: { ...typography.subhead, color: colors.text, marginBottom: spacing.xs },
  metaSmall: { ...typography.footnote, color: colors.textSecondary },
  sectionLabel: { ...typography.caption1, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  muted: { ...typography.footnote, color: colors.textSecondary },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  actions: { marginTop: spacing.sm },
  actionBtn: { marginBottom: spacing.sm },
  stateWrap: { flex: 1, justifyContent: "center" },
});
