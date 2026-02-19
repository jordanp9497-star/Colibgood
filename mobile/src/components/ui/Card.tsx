import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, spacing } from "@/theme";

type CardProps = ViewProps & {
  children: React.ReactNode;
};

export function Card({ children, style, ...rest }: CardProps) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
