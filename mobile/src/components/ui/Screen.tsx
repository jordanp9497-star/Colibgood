import { StyleSheet, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  /** If true, no horizontal padding (e.g. for full-width lists) */
  noPadding?: boolean;
};

export function Screen({ children, style, noPadding, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: noPadding ? 0 : insets.left + spacing.md,
          paddingRight: noPadding ? 0 : insets.right + spacing.md,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
