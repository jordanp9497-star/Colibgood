/**
 * Envoi de push notifications via Expo Push API
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  channelId?: string;
};

export async function sendExpoPush(messages: ExpoMessage[]): Promise<{ success: number; failed: number }> {
  if (messages.length === 0) return { success: 0, failed: 0 };
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    console.error("Expo Push API error", res.status, await res.text());
    return { success: 0, failed: messages.length };
  }
  const result = (await res.json()) as { data: { status: string }[] };
  const success = result.data?.filter((r) => r.status === "ok").length ?? 0;
  return { success, failed: messages.length - success };
}
