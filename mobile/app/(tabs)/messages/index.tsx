import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { colors, spacing, typography } from "@/theme";

// TODO: Remplacer par Supabase Realtime (conversations réelles)
const MOCK_CONVERSATIONS = [
  { id: "1", title: "Jean M.", lastMessage: "D'accord pour demain 14h", lastAt: "2025-02-05T10:00:00Z" },
  { id: "2", title: "Marie L.", lastMessage: "Le colis fait environ 5 kg", lastAt: "2025-02-04T18:30:00Z" },
];

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { timeStyle: "short" });
  } catch {
    return "";
  }
}

export default function MessagesIndexScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Vos conversations</Text>
      {MOCK_CONVERSATIONS.map((c) => (
        <TouchableOpacity key={c.id} activeOpacity={0.8} onPress={() => router.push(`/(tabs)/messages/${c.id}`)}>
          <Card style={styles.card}>
            <Text style={styles.name}>{c.title}</Text>
            <Text style={styles.preview} numberOfLines={1}>{c.lastMessage}</Text>
            <Text style={styles.time}>{formatTime(c.lastAt)}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { marginBottom: spacing.sm },
  name: { ...typography.headline, color: colors.text },
  preview: { ...typography.footnote, color: colors.textSecondary, marginTop: spacing.xs },
  time: { ...typography.caption1, color: colors.textTertiary, marginTop: spacing.xs },
});
