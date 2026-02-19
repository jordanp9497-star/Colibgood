import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function TripsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Vos trajets" }} />
      <Stack.Screen name="[id]" options={{ title: "Détail" }} />
    </Stack>
  );
}
