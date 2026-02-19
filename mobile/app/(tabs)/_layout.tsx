import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRegisterPushToken } from "@/hooks/useRegisterPushToken";
import { Logo } from "@/components/ui/Logo";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { userId } = useAuth();
  useRegisterPushToken(!!userId);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <Logo />,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          title: "Recherche",
          tabBarLabel: "Recherche",
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: "Publier",
          tabBarLabel: "Publier",
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Mes Trajets",
          tabBarLabel: "Mes Trajets",
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="listings" options={{ href: null }} />
      <Tabs.Screen name="shipments" options={{ href: null }} />
      <Tabs.Screen name="map" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 11,
  },
});
