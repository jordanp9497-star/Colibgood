import { StyleSheet, Text, TextInput, TouchableOpacity, View, type TextInputProps } from "react-native";
import { colors, spacing, typography } from "@/theme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightLabel?: string;
  onRightLabelPress?: () => void;
};

export function Input({
  label,
  error,
  leftIcon,
  rightLabel,
  onRightLabelPress,
  style,
  editable = true,
  ...rest
}: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, error && styles.inputWrapError, !editable && styles.inputWrapDisabled]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, !!leftIcon && styles.inputWithIcon, style]}
          placeholderTextColor={colors.textTertiary}
          editable={editable}
          {...rest}
        />
        {rightLabel && onRightLabelPress ? (
          <TouchableOpacity onPress={onRightLabelPress} style={styles.rightLabel}>
            <Text style={styles.rightLabelText}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  inputWrapError: { borderColor: colors.destructive },
  inputWrapDisabled: { opacity: 0.6 },
  leftIcon: { paddingLeft: spacing.md },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputWithIcon: { paddingLeft: spacing.xs },
  rightLabel: {
    paddingHorizontal: spacing.md,
  },
  rightLabelText: {
    ...typography.footnote,
    color: colors.primary,
    fontWeight: "600",
  },
  error: {
    ...typography.footnote,
    color: colors.destructive,
    marginTop: spacing.xs,
  },
});
