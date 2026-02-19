import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Retour",
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontSize: 17 },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Messages" }} />
      <Stack.Screen name="[id]" options={{ title: "Conversation" }} />
    </Stack>
  );
}
