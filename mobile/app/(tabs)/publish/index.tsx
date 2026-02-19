import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacing, typography } from "@/theme";

export default function PublishIndexScreen() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    // Redirect directly based on role
    if (profile?.role === "driver" || profile?.role === "admin") {
      router.replace("/(tabs)/trips/create");
    } else {
      router.replace("/(tabs)/listings/create");
    }
  }, [profile, isLoading, router]);

  return (
    <Screen>
      <Text style={styles.text}>Redirection...</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xxl },
});
