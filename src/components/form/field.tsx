/**
 * A labelled text field with its error underneath.
 *
 * Grown from the one M1 kept inside the sign-in screen, now that sign-up needs
 * the same thing six times over.
 *
 * The error sits under its own field and is announced when it appears
 * (CLAUDE.md, "UX quality bar"): a parent using a screen reader finds out
 * which field is wrong without hunting for it. Colour never carries the
 * meaning alone — there is always the sentence.
 */
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { useTheme } from "@/theme";

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  /** The message under the field. Undefined while the field is fine. */
  error?: string;
} & Pick<
  TextInputProps,
  | "keyboardType"
  | "secureTextEntry"
  | "autoCapitalize"
  | "autoComplete"
  | "textContentType"
  | "returnKeyType"
  | "onSubmitEditing"
  | "editable"
>;

export function Field({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  ...inputProps
}: FieldProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs }}>
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fontFamily.bodyBold,
          fontSize: theme.fontSize.sm,
        }}
      >
        {label}
      </Text>

      <TextInput
        accessibilityLabel={label}
        aria-invalid={error !== undefined}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        autoCapitalize="none"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: error ? theme.colors.destructive : theme.colors.border,
          borderRadius: theme.radius.base,
          borderWidth: 1,
          color: theme.colors.foreground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.base,
          minHeight: theme.minTouchTarget,
          paddingHorizontal: theme.space.md,
        }}
        {...inputProps}
      />

      {error === undefined ? null : (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: theme.colors.destructive,
            fontFamily: theme.fontFamily.body,
            fontSize: theme.fontSize.sm,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
