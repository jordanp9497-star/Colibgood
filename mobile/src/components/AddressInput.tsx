import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchAddresses, type PlaceResult } from "@/lib/geocode";
import { colors, spacing, typography } from "@/theme";

const DEBOUNCE_MS = 400;

type AddressInputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace?: (place: PlaceResult) => void;
  error?: string;
  /** Bouton optionnel à droite (ex. "Ma position") */
  rightButton?: { label: string; onPress: () => void; loading?: boolean };
};

export function AddressInput({
  label,
  placeholder = "Ville ou adresse",
  value,
  onChangeText,
  onSelectPlace,
  error,
  rightButton,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    setLoading(true);
    setShowList(true);
    try {
      const results = await searchAddresses(q);
      setSuggestions(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(q), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runSearch]);

  const handleSelect = useCallback(
    (place: PlaceResult) => {
      onChangeText(place.display_name);
      onSelectPlace?.(place);
      setSuggestions([]);
      setShowList(false);
    },
    [onChangeText, onSelectPlace]
  );

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => value.trim().length >= 2 && setShowList(true)}
          />
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : null}
        </View>
        {rightButton ? (
          <Pressable
            onPress={rightButton.onPress}
            disabled={rightButton.loading}
            style={({ pressed }) => [styles.rightBtn, pressed && styles.rightBtnPressed]}
          >
            <Text style={styles.rightBtnText}>
              {rightButton.loading ? "…" : rightButton.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showList && suggestions.length > 0 ? (
        <ScrollView
          style={styles.listWrap}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {suggestions.map((item, index) => (
            <Pressable
              key={`${item.lat}-${item.lng}-${index}`}
              style={({ pressed }) => [styles.suggestionItem, pressed && styles.suggestionItemPressed]}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.suggestionText} numberOfLines={2}>
                {item.display_name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
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
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  inputWrapError: { borderColor: colors.destructive },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  loader: { marginRight: spacing.sm },
  rightBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rightBtnPressed: { opacity: 0.8 },
  rightBtnText: { ...typography.headline, color: colors.primary },
  error: {
    ...typography.footnote,
    color: colors.destructive,
    marginTop: spacing.xs,
  },
  listWrap: {
    marginTop: spacing.xs,
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  suggestionItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionItemPressed: { backgroundColor: colors.surfaceElevated },
  suggestionText: { ...typography.body, color: colors.text },
});
