/**
 * Signing in.
 *
 * The look is M1's, now with something behind it. Three answers from the
 * server need handling differently (docs/PLAN.md, M3):
 *
 * - `wrong_credentials` keeps the email, so a parent who mistyped a password
 *   doesn't retype their address as well. It must **not** sign them out, even
 *   though it is a 401 — the API client already branches on the code.
 * - `too_many_tries` leaves the form usable. Being rate-limited is not a
 *   reason to take the keyboard away.
 * - `invalid_input` puts each of the server's own messages under its field.
 *
 * There is no "Forgot password?" link: it would lead nowhere until Talaan's
 * Step 55.5, and a link that leads nowhere is worse than none
 * (docs/PRODUCT-RULES.md).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { signInFormSchema, type SignInForm } from "@/auth/form-schemas";
import { takeEmailForSignIn } from "@/auth/pending-email";
import { applyServerFieldErrors } from "@/auth/server-errors";
import { useSignIn } from "@/auth/session";
import { Logo } from "@/components/brand/logo";
import { ServerCheck } from "@/components/dev/server-check";
import { Button } from "@/components/form/button";
import { Field } from "@/components/form/field";
import { TextLink } from "@/components/form/text-link";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

const SIGN_IN_FIELDS = ["email", "password"] as const satisfies readonly (keyof SignInForm)[];

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const signIn = useSignIn();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInFormSchema),
    // Filled in when they arrived here from "Sign in instead" after a 409.
    defaultValues: { email: takeEmailForSignIn() ?? "", password: "" },
  });

  // Anything the server says that is not about a field this form has: a wrong
  // password, too many tries, no internet. Shown above the button, in the
  // server own words.
  const [formError, setFormError] = useState<string | undefined>();

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined);

    signIn.mutate(values, {
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          setFormError(strings.errors.unexpected);
          return;
        }

        // Only show the message above the button when nothing landed on a
        // field, or the parent would be left with no explanation at all.
        if (!applyServerFieldErrors(error, SIGN_IN_FIELDS, setError)) {
          setFormError(error.message);
        }
      },
    });
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: theme.space.xl,
          justifyContent: "center",
          padding: theme.space.xl,
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
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Field
                label={strings.signIn.emailLabel}
                placeholder={strings.signIn.emailPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!signIn.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Field
                label={strings.signIn.passwordLabel}
                placeholder={strings.signIn.passwordPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => onSubmit()}
                editable={!signIn.isPending}
              />
            )}
          />
        </View>

        {formError === undefined ? null : (
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: theme.colors.destructive,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.sm,
            }}
          >
            {formError}
          </Text>
        )}

        <Button
          label={strings.signIn.submit}
          busyLabel={strings.signIn.submitting}
          busy={signIn.isPending}
          onPress={onSubmit}
        />

        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.space.xs,
            justifyContent: "center",
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
          <TextLink
            label={strings.signIn.signUp}
            onPress={() => router.push("/sign-up")}
          />
        </View>

        <ServerCheck />
      </ScrollView>
    </SafeAreaView>
  );
}
