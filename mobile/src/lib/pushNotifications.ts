import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    if (finalStatus !== "granted") return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Colib",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const Constants = (await import("expo-constants")).default;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.manifest?.extra?.eas?.projectId ??
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (!projectId) {
      // Expo Go / pas de projectId : pas de crash, push désactivé jusqu'à config EAS
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data ?? null;
  } catch {
    return null;
  }
}
