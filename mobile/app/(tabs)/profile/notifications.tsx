import { FlatList, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationRow } from "@/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function NotificationsScreen() {
  const { data = [], isLoading, error } = useNotifications(50);

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Screen>
        <EmptyState title="Erreur" subtitle={error.message} />
      </Screen>
    );
  }

  return (
    <Screen noPadding>
      <FlatList
        data={data}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Notifications</Text>}
        ListEmptyComponent={<EmptyState title="Aucune notification" />}
        renderItem={({ item }: { item: NotificationRow }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title ?? "Notification"}</Text>
            {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#fafafa", marginBottom: 16 },
  card: {
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#fafafa", marginBottom: 4 },
  cardBody: { fontSize: 14, color: "#d4d4d8", marginBottom: 10 },
  cardDate: { fontSize: 12, color: "#71717a" },
});

