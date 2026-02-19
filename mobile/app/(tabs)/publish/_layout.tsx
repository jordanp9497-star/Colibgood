import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function PublishLayout() {
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
      <Stack.Screen name="index" options={{ title: "Publier" }} />
      <Stack.Screen name="trip" options={{ title: "Publier un trajet" }} />
      <Stack.Screen name="package" options={{ title: "Publier un colis" }} />
    </Stack>
  );
}
