import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUp() {
    const e = email.trim();
    if (!e || !password) {
      Alert.alert("Erreur", "Remplissez tous les champs.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    let error: { message: string } | null = null;
    try {
      const result = await supabase.auth.signUp({ email: e, password });
      error = result.error;
    } catch (err) {
      error = { message: err instanceof Error ? err.message : "Erreur réseau" };
    }
    setLoading(false);
    if (error) {
      const isNetwork =
        error.message.includes("Network request failed") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("network");
      const msg = isNetwork
        ? "Impossible de joindre Supabase. Vérifiez : 1) Connexion internet 2) Fichier mobile/.env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY (Dashboard Supabase → Settings → API) 3) Redémarrez Metro : npx expo start --clear"
        : error.message;
      Alert.alert("Erreur", msg);
      return;
    }
    Alert.alert(
      "Inscription réussie",
      "Connectez-vous avec votre email et mot de passe. Si vous voyez « Invalid login credentials », désactivez la confirmation d’email dans Supabase : Authentication → Providers → Email → décocher « Confirm email ».",
      [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.form}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Colib</Text>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Input
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Input
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Button title="Créer un compte" onPress={signUp} loading={loading} disabled={loading} />
        <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.linkWrap}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, justifyContent: "center", paddingVertical: 24 },
  title: { fontSize: 28, fontWeight: "700", color: "#fafafa", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#a1a1aa", marginBottom: 32 },
  linkWrap: { marginTop: 24, alignSelf: "center" },
  link: { fontSize: 15, color: "#a78bfa" },
});
