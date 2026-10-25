/**
 * Picking a date — the child's date of birth.
 *
 * The platform's own picker, because docs/PRODUCT-RULES.md says the birth
 * date is chosen, "never typed free-hand": a parent typing 03/04/2014 can
 * mean two different days, and the server will only say "no match".
 *
 * The date shown back is formatted from the app's own month names, not the
 * phone's locale, so it reads the same on every phone.
 *
 * **This is an Android-shaped implementation, deliberately.** On Android the
 * dialog fires `onChange` once and closes itself, so closing on the first
 * event is right. On iOS `display="spinner"` renders *inline* and fires
 * `onChange` with `type: "set"` on every tick of the wheel — so the same code
 * would close the picker on the first nudge and commit a half-scrolled date.
 * iOS needs a `Platform.OS` branch with its own Done button before it ships
 * (docs/recipes/step-M4-link-child.md). Nothing else here is platform
 * specific, so that is a branch, not a rewrite.
 *
 * What the parent picked is visible while they are filling the form in, and
 * never after that — a birth date is "typed by the parent once, when linking,
 * and never shown back" (docs/PRODUCT-RULES.md:37).
 */
import { useState } from "react";

import DateTimePicker from "@react-native-community/datetimepicker";
import { Pressable, Text, View } from "react-native";

import { strings } from "@/strings";
import { useTheme } from "@/theme";

type DateFieldProps = {
  label: string;
  placeholder: string;
  value: Date | undefined;
  onChange: (value: Date) => void;
  error?: string;
  disabled?: boolean;
  /** Nothing later than this can be chosen. Defaults to today. */
  maximumDate?: Date;
  minimumDate?: Date;
};

/** "3 March 2014", from our own month names. */
function readableDate(date: Date): string {
  return `${date.getDate()} ${strings.months[date.getMonth()]} ${date.getFullYear()}`;
}

export function DateField({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  maximumDate,
  minimumDate,
}: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  // Opening on today would make a parent scroll back a dozen years every
  // time. Children are in grades 7 to 12, so start in the right decade.
  const startAt = value ?? thirteenYearsAgo();

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
        accessibilityValue={{ text: value ? readableDate(value) : placeholder }}
        accessibilityState={{ disabled }}
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
            color: value
              ? theme.colors.foreground
              : theme.colors.mutedForeground,
            fontFamily: theme.fontFamily.body,
            fontSize: theme.fontSize.base,
          }}
        >
          {value ? readableDate(value) : placeholder}
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

      {open ? (
        <DateTimePicker
          value={startAt}
          mode="date"
          display="spinner"
          maximumDate={maximumDate ?? new Date()}
          minimumDate={minimumDate}
          onChange={(event, picked) => {
            // Android fires once and closes itself; "dismissed" means the
            // parent backed out and nothing should change.
            setOpen(false);

            if (event.type === "set" && picked) {
              onChange(picked);
            }
          }}
        />
      ) : null}
    </View>
  );
}

function thirteenYearsAgo(): Date {
  const now = new Date();
  return new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
}
