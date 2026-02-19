import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

export function Logo() {
  return (
    <View style={styles.row}>
      <View style={styles.box}>
        <View style={styles.boxLidLeft} />
        <View style={styles.boxLidRight} />
        <View style={styles.boxTape} />
      </View>
      <Text style={styles.text}>Colib</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  box: {
    width: 22,
    height: 18,
    backgroundColor: colors.primary,
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  boxLidLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "52%",
    height: 6,
    backgroundColor: "#9155fd",
  },
  boxLidRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "52%",
    height: 6,
    backgroundColor: "#7c3aed",
  },
  boxTape: {
    position: "absolute",
    top: 0,
    left: "45%",
    width: "10%",
    height: "100%",
    backgroundColor: "#f5f3ff",
    opacity: 0.9,
  },
  text: { ...typography.headline, color: colors.text },
});
