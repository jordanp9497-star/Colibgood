import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

const extra = (Constants.expoConfig as { extra?: { apiUrl?: string } } | null)?.extra;
let API_URL = extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

if (!__DEV__ && API_URL.startsWith("http://")) {
  API_URL = API_URL.replace(/^http:\/\//, "https://");
}

if (__DEV__ && (API_URL.includes("localhost") || API_URL.includes("127.0.0.1"))) {
  if (Platform.OS === "android") {
    API_URL = API_URL.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
  } else {
    // iPhone / Expo Go : même IP que le serveur Metro (ta machine sur le réseau)
    const hostUri = (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
    if (hostUri) {
      const host = hostUri.replace(/^exp:\/\//, "").split(":")[0];
      if (host && host !== "localhost") {
        const port = (API_URL.match(/:(\d+)/)?.[1]) ?? "3000";
        API_URL = `http://${host}:${port}`;
      }
    }
  }
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

const FETCH_TIMEOUT_MS = 15000;

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    const msg =
      e instanceof Error && e.name === "AbortError"
        ? (__DEV__
          ? "Délai dépassé. Vérifiez que l’API tourne sur votre PC (port 3000) et que l’iPhone est sur le même Wi‑Fi. Si besoin, définissez EXPO_PUBLIC_API_URL dans mobile/.env avec l’IP de votre PC (ex: http://192.168.1.5:3000)."
          : "Délai dépassé. Vérifiez votre connexion et réessayez.")
        : e instanceof Error
          ? e.message
          : "Erreur réseau";
    return { error: msg, status: 0 };
  }
  clearTimeout(timeoutId);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return { error: text || "Unknown error", status: res.status };
  }
  if (!res.ok) {
    const err = json && typeof json === "object" && "error" in json ? (json as { error: string }).error : res.statusText;
    return { error: err, status: res.status };
  }
  return { data: json as T, status: res.status };
}

export const apiGet = <T>(path: string) => api<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path: string) => api<unknown>(path, { method: "DELETE" });
