import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Profil",
        headerBackTitle: "Retour",
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontSize: 17 },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="proposals-inbox" options={{ title: "Propositions" }} />
    </Stack>
  );
}
