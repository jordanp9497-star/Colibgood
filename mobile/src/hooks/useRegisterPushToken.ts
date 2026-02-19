import { useEffect, useRef } from "react";
import { apiPost } from "@/lib/api";
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";

/**
 * Enregistre le token Expo Push auprès de l'API quand l'utilisateur est connecté.
 * À utiliser une fois que la session est disponible (ex. dans un layout ou écran authentifié).
 */
export function useRegisterPushToken(isAuthenticated: boolean) {
  const registered = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token) return;
      if (registered.current === token) return;
      const { error } = await apiPost("/devices/register", { token });
      if (!cancelled && !error) registered.current = token;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
