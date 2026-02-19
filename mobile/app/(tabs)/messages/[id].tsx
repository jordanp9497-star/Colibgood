import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing, typography } from "@/theme";

// TODO: Brancher Supabase Realtime pour les messages
const MOCK_MESSAGES = [
  { id: "m1", senderId: "other", body: "Bonjour, vous avez un trajet Paris–Lyon le 6 février ?", created_at: "2025-02-05T09:00:00Z" },
  { id: "m2", senderId: "me", body: "Oui, départ vers 14h.", created_at: "2025-02-05T09:05:00Z" },
  { id: "m3", senderId: "other", body: "D'accord pour demain 14h", created_at: "2025-02-05T10:00:00Z" },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const canSend = input.trim().length > 0;

  function deleteMessage(id: string) {
    Alert.alert("Supprimer le message", "Voulez-vous supprimer ce message ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => setMessages((prev) => prev.filter((m) => m.id !== id)),
      },
    ]);
  }

  function sendMessage() {
    if (!canSend) return;
    const body = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, senderId: "me", body, created_at: new Date().toISOString() },
    ]);
    setInput("");
  }

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
        <Text style={styles.header}>Conversation {id}</Text>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => deleteMessage(item.id)}
              style={[styles.bubble, item.senderId === "me" ? styles.bubbleMe : styles.bubbleOther]}
            >
              <Text style={styles.bubbleText}>{item.body}</Text>
            </Pressable>
          )}
          style={styles.list}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            onPress={sendMessage}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && styles.sendBtnDisabled,
              pressed && canSend && styles.sendBtnPressed,
            ]}
          >
            <Text style={styles.sendText}>Envoyer</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboard: { flex: 1 },
  header: { ...typography.headline, color: colors.text, marginBottom: spacing.sm },
  list: { flex: 1 },
  bubble: { maxWidth: "80%", padding: spacing.sm, borderRadius: 12, marginVertical: spacing.xs },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: colors.primary },
  bubbleOther: { alignSelf: "flex-start", backgroundColor: colors.surfaceElevated },
  bubbleText: { ...typography.body, color: colors.text },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sendBtn: {
    minWidth: 88,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceElevated },
  sendBtnPressed: { opacity: 0.85 },
  sendText: { ...typography.headline, color: "#fff" },
});
