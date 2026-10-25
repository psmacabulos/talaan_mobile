/**
 * Choosing one thing from a short list — the child's school.
 *
 * Built rather than pulled in: with a handful of schools this is a modal and a
 * list, and owning it keeps the design tokens, the 48-point targets and the
 * screen-reader behaviour the same as every other field. A native picker
 * would bring its own look on each platform and a second native dependency.
 *
 * The closed control is a button saying what is chosen, and each row in the
 * sheet reports whether it is the selected one, so a screen reader announces
 * the current choice rather than just a list of names.
 */
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { strings } from "@/strings";
import { useTheme } from "@/theme";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  placeholder: string;
  /** The title of the sheet that opens. */
  sheetTitle: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function SelectField({
  label,
  placeholder,
  sheetTitle,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: SelectFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const chosen = options.find((option) => option.value === value);

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: chosen?.label ?? placeholder }}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          backgroundColor: theme.colors.card,
          borderColor: error ? theme.colors.destructive : theme.colors.border,
          borderRadius: theme.radius.base,
          borderWidth: 1,
          justifyContent: "center",
          minHeight: theme.minTouchTarget,
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
        })}
      >
        <Text
          style={{
            color: chosen
              ? theme.colors.foreground
              : theme.colors.mutedForeground,
            fontFamily: theme.fontFamily.body,
            fontSize: theme.fontSize.base,
          }}
        >
          {chosen?.label ?? placeholder}
        </Text>
      </Pressable>

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

      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setOpen(false)}
        // Android's back button closes the sheet, not the screen behind it.
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          edges={["top", "bottom"]}
        >
          <View
            style={{
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
              padding: theme.space.base,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fontFamily.headingBold,
                fontSize: theme.fontSize.md,
              }}
            >
              {sheetTitle}
            </Text>
          </View>

          <ScrollView>
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? theme.colors.muted
                      : theme.colors.background,
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: 1,
                    justifyContent: "center",
                    minHeight: theme.minTouchTarget,
                    paddingHorizontal: theme.space.base,
                    paddingVertical: theme.space.md,
                  })}
                >
                  <Text
                    style={{
                      color: selected
                        ? theme.colors.primary
                        : theme.colors.foreground,
                      fontFamily: selected
                        ? theme.fontFamily.bodyBold
                        : theme.fontFamily.body,
                      fontSize: theme.fontSize.base,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ padding: theme.space.base }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={({ pressed }) => ({
                alignItems: "center",
                justifyContent: "center",
                minHeight: theme.minTouchTarget,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: theme.colors.link,
                  fontFamily: theme.fontFamily.bodyBold,
                  fontSize: theme.fontSize.base,
                }}
              >
                {strings.common.close}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
