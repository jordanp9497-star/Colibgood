import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Role = "shipper" | "driver";

export default function OnboardingScreen() {
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userId, refetchProfile } = useAuth();

  async function saveProfile() {
    if (!role) return;
    if (!userId) {
      router.replace("/(auth)/login");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert(
      { user_id: userId, role, full_name: fullName.trim() || null },
      { onConflict: "user_id" }
    );
    setLoading(false);
    if (error) {
      Alert.alert("Erreur", error.message);
      return;
    }
    await refetchProfile();
    router.replace("/(tabs)/listings");
  }

  return (
    <Screen>
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>Choisissez votre profil</Text>

      <Button
        title="Je suis expéditeur (shipper)"
        onPress={() => setRole("shipper")}
        variant={role === "shipper" ? "primary" : "secondary"}
      />
      <Button
        title="Je suis transporteur (driver)"
        onPress={() => setRole("driver")}
        variant={role === "driver" ? "primary" : "secondary"}
        containerStyle={{ marginTop: 12 }}
      />

      {role && (
        <>
          <Text style={[styles.label, { marginTop: 24 }]}>Votre nom (optionnel)</Text>
          <Input placeholder="Nom complet" value={fullName} onChangeText={setFullName} />
          <Button title={loading ? "Enregistrement…" : "Continuer"} onPress={saveProfile} disabled={loading} containerStyle={{ marginTop: 8 }} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", color: "#fafafa", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#a1a1aa", marginBottom: 24 },
  label: { fontSize: 14, color: "#a1a1aa", marginBottom: 8 },
  });
