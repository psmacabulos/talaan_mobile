/**
 * Creating an account.
 *
 * Six fields, because that is what the server asks for: first and last name
 * separately, a mobile number, an email and a password typed twice
 * (docs/TALAAN-API.md:52). The design mockup shows one "Full Name" field and
 * no mobile at all — see docs/DESIGN-QUESTIONS.md, rows 1 and 2.
 *
 * No school is chosen here. One account covers children at any number of
 * Bantay Aral schools, and each child brings its own when it is linked (M4).
 *
 * A `409` means the email already belongs to someone. That is not an error to
 * apologise for — it is a parent who already has an account, so they are
 * offered the way in rather than left to work it out.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { signUpFormSchema, type SignUpForm } from "@/auth/form-schemas";
import { rememberEmailForSignIn } from "@/auth/pending-email";
import { applyServerFieldErrors } from "@/auth/server-errors";
import { useSignUp } from "@/auth/session";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/form/button";
import { Field } from "@/components/form/field";
import { TextLink } from "@/components/form/text-link";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

const SIGN_UP_FIELDS = [
  "firstName",
  "lastName",
  "mobile",
  "email",
  "password",
  "confirmPassword",
] as const satisfies readonly (keyof SignUpForm)[];

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const signUp = useSignUp();

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const emailTaken =
    signUp.error instanceof ApiError && signUp.error.code === "conflict";

  const [formError, setFormError] = useState<string | undefined>();

  const onSubmit = handleSubmit(({ confirmPassword: _ignored, ...values }) => {
    setFormError(undefined);

    signUp.mutate(values, {
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          setFormError(strings.errors.unexpected);
          return;
        }

        // The server can name a field this form does not have — deviceLabel
        // is sent with every sign-up. Showing the message above the button
        // when nothing landed is what stops a failure being silent.
        if (!applyServerFieldErrors(error, SIGN_UP_FIELDS, setError)) {
          setFormError(error.message);
        }
      },
    });
  });

  const goToSignIn = () => {
    rememberEmailForSignIn(getValues("email"));
    router.replace("/sign-in");
  };

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
        <View style={{ alignItems: "center" }}>
          <Logo size={48} />
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
            {strings.signUp.heading}
          </Text>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.base,
            }}
          >
            {strings.signUp.subheading}
          </Text>
        </View>

        <View style={{ gap: theme.space.base }}>
          <Controller
            control={control}
            name="firstName"
            render={({ field }) => (
              <Field
                label={strings.signUp.firstNameLabel}
                placeholder={strings.signUp.firstNamePlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.firstName?.message}
                autoCapitalize="words"
                autoComplete="given-name"
                editable={!signUp.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <Field
                label={strings.signUp.lastNameLabel}
                placeholder={strings.signUp.lastNamePlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.lastName?.message}
                autoCapitalize="words"
                autoComplete="family-name"
                editable={!signUp.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="mobile"
            render={({ field }) => (
              <Field
                label={strings.signUp.mobileLabel}
                placeholder={strings.signUp.mobilePlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.mobile?.message}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!signUp.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Field
                label={strings.signUp.emailLabel}
                placeholder={strings.signUp.emailPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!signUp.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Field
                label={strings.signUp.passwordLabel}
                placeholder={strings.signUp.passwordPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                editable={!signUp.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <Field
                label={strings.signUp.confirmPasswordLabel}
                placeholder={strings.signUp.confirmPasswordPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={() => onSubmit()}
                editable={!signUp.isPending}
              />
            )}
          />
        </View>

        {formError === undefined ? null : (
          <View style={{ gap: theme.space.xs }}>
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
            {emailTaken ? (
              <TextLink
                label={strings.signUp.signInInstead}
                onPress={goToSignIn}
              />
            ) : null}
          </View>
        )}

        <Button
          label={strings.signUp.submit}
          busyLabel={strings.signUp.submitting}
          busy={signUp.isPending}
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
            {strings.signUp.haveAccount}
          </Text>
          <TextLink label={strings.signUp.signIn} onPress={goToSignIn} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
