import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn() {
    const e = email.trim();
    if (!e || !password) return;
    setLoading(true);
    let error: { message: string } | null = null;
    try {
      const result = await supabase.auth.signInWithPassword({ email: e, password });
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
        ? "Impossible de joindre Supabase. Vérifiez la connexion internet et mobile/.env (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY). Puis redémarrez Metro : npx expo start --clear"
        : error.message === "Email not confirmed"
          ? "Compte non confirmé. Vérifiez vos mails (et les spams) pour le lien de confirmation."
          : error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect. Si vous venez de vous inscrire, désactivez « Confirm email » dans Supabase : Authentication → Providers → Email, puis réessayez."
            : error.message;
      Alert.alert("Erreur", msg);
      return;
    }
    router.replace("/(tabs)/search");
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.form}>
        <Text style={styles.title}>Colib</Text>
        <Text style={styles.subtitle}>Connectez-vous avec votre email</Text>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Input
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        <Button title="Se connecter" onPress={signIn} loading={loading} disabled={loading} />
        <Pressable onPress={() => router.push("/(auth)/signup")} style={styles.linkWrap}>
          <Text style={styles.link}>Pas de compte ? S'inscrire</Text>
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
