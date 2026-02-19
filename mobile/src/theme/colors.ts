export const colors = {
  background: "#0a0a0a",
  backgroundSecondary: "#141414",
  surface: "#1c1c1e",
  surfaceElevated: "#2c2c2e",
  border: "#38383a",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  textTertiary: "#71717a",
  primary: "#0a84ff",
  primaryPressed: "#409cff",
  destructive: "#ff453a",
  success: "#32d74b",
  warning: "#ff9f0a",
  confidential: "#8e8e93",
} as const;

export type Colors = typeof colors;
