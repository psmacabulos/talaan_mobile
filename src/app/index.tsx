/**
 * The sign-in screen's look. Nothing signs in yet: the fields and the button
 * are here so the type, colour, spacing and the logo can be checked on a real
 * phone. M3 gives them behaviour, validation and the server's errors.
 *
 * The layout scrolls so it still works when a parent has large text turned on
 * and on a 360-point phone, where the form is taller than the screen.
 */
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/components/brand/logo";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function SignInScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: theme.space.xl,
          gap: theme.space.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", gap: theme.space.base }}>
          <Logo size={56} />
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.sm,
              textAlign: "center",
            }}
          >
            {strings.brand.tagline}
          </Text>
        </View>

        <View style={{ gap: theme.space.xs }}>
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.foreground,
              fontFamily: theme.fontFamily.headingBold,
              fontSize: theme.fontSize.xl,
            }}
          >
            {strings.signIn.heading}
          </Text>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.base,
            }}
          >
            {strings.signIn.subheading}
          </Text>
        </View>

        <View style={{ gap: theme.space.base }}>
          <Field
            label={strings.signIn.emailLabel}
            placeholder={strings.signIn.emailPlaceholder}
            keyboardType="email-address"
          />
          <Field
            label={strings.signIn.passwordLabel}
            placeholder={strings.signIn.passwordPlaceholder}
            secureTextEntry
          />
        </View>

        {/* Deliberately not a button yet. M3 wires it up; until then a
            screen reader must not announce a control that does nothing. */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.md,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.space.base,
          }}
        >
          <Text
            style={{
              color: theme.colors.primaryForeground,
              fontFamily: theme.fontFamily.heading,
              fontSize: theme.fontSize.base,
            }}
          >
            {strings.signIn.submit}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: theme.space.xs,
          }}
        >
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.sm,
            }}
          >
            {strings.signIn.noAccount}
          </Text>
          <Text
            style={{
              color: theme.colors.link,
              fontFamily: theme.fontFamily.bodyBold,
              fontSize: theme.fontSize.sm,
            }}
          >
            {strings.signIn.signUp}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  placeholder: string;
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
};

/** A labelled text field. M3 adds validation and the error line under it. */
function Field({
  label,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
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
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.base,
          borderWidth: 1,
          color: theme.colors.foreground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.base,
          minHeight: theme.minTouchTarget,
          paddingHorizontal: theme.space.md,
        }}
      />
    </View>
  );
}
