import { Stack } from "expo-router";

export default function ListingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/propose" />
    </Stack>
  );
}
