import { StyleSheet, Text, TouchableOpacity, type GestureResponderEvent } from "react-native";
import { colors, spacing, typography } from "@/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Back-compat for older screens */
  containerStyle?: object;
  style?: object;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  containerStyle,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        containerStyle,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, styles[`text_${variant}`], isDisabled && styles.textDisabled]}>
        {loading ? "Chargement…" : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: colors.destructive,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.headline,
    color: colors.text,
  },
  text_primary: { color: "#fff" },
  text_secondary: { color: colors.text },
  text_ghost: { color: colors.primary },
  text_destructive: { color: "#fff" },
  textDisabled: { color: colors.textSecondary },
});
