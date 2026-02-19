import { StyleSheet, Text, View } from "react-native";

type EmptyStateProps = { title: string; subtitle?: string };

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  title: { fontSize: 18, fontWeight: "600", color: "#fafafa", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#a1a1aa", textAlign: "center" },
});
