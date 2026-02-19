import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function MapLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Colib",
        headerBackTitle: "Retour",
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontSize: 18 },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Carte" }} />
    </Stack>
  );
}
