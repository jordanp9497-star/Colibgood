import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCreateProposal } from "@/hooks/useProposals";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileVerification } from "@/services/profileVerification";

export default function CreateProposalScreen() {
  const { id: listingId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const create = useCreateProposal();
  const { userId, profile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [priceCents, setPriceCents] = useState("");
  const [message, setMessage] = useState("");
  const requiresVerification = profile?.role === "driver";
  const isVerified = !requiresVerification || verificationStatus === "approved";

  useEffect(() => {
    if (!requiresVerification || !userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await getProfileVerification(userId);
      if (!cancelled) setVerificationStatus(data?.status ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [requiresVerification, userId]);

  async function submit() {
    if (!listingId) return;
    if (!isVerified) {
      Alert.alert("Vérification requise", "Votre profil doit être vérifié pour proposer sur une annonce.");
      return;
    }
    const payload = {
      listing_id: listingId,
      price_cents: priceCents ? Math.round(parseFloat(priceCents) * 100) : undefined,
      message: message.trim() || undefined,
    };
    try {
      await create.mutateAsync(payload);
      router.back();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Envoi impossible");
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Faire une proposition</Text>
      {requiresVerification && !isVerified ? (
        <Text style={styles.warning}>
          Vérification requise (statut: {verificationStatus ?? "non vérifié"}). Complétez la vérification dans l’onglet Profil.
        </Text>
      ) : null}
      <Input
        placeholder="Prix (€)"
        value={priceCents}
        onChangeText={setPriceCents}
        keyboardType="decimal-pad"
      />
      <Input placeholder="Message (optionnel)" value={message} onChangeText={setMessage} multiline />
      <Button
        title={create.isPending ? "Envoi…" : "Envoyer la proposition"}
        onPress={submit}
        disabled={create.isPending || !isVerified}
        containerStyle={{ marginTop: 8 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: "#fafafa", marginBottom: 20 },
  warning: { fontSize: 13, color: "#fbbf24", marginBottom: 12 },
});
