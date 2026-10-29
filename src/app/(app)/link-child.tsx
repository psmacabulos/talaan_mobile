/**
 * Linking a child to this parent.
 *
 * Four details, all checked against the school's records at once
 * (docs/TALAAN-API.md). The server answers `404 not_found` when nothing
 * matches and will not say which of the four was wrong — so neither does
 * this screen. It shows the server's words and then one line naming all four
 * things to check, which is honest and more useful than guessing at the
 * birth date.
 *
 * Nothing typed here is kept. The LRN and the birth date are sent once and
 * are never sent back by the server (docs/PRODUCT-RULES.md:73).
 */
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Text, View } from "react-native";

import { ApiError } from "@/api/errors";
import {
  linkChildFormSchema,
  type LinkChildForm,
} from "@/children/form-schema";
import { useLinkChild, useSchools } from "@/children/use-children";
import { Button } from "@/components/form/button";
import { DateField } from "@/components/form/date-field";
import { Field } from "@/components/form/field";
import { FormScreen } from "@/components/form/form-screen";
import { SelectField } from "@/components/form/select-field";
import { TextLink } from "@/components/form/text-link";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function LinkChildScreen() {
  const theme = useTheme();
  const router = useRouter();
  const schools = useSchools();
  const link = useLinkChild();

  const [formError, setFormError] = useState<string | undefined>();
  // Shown under the message when nothing matched: the parent needs to know
  // which four things to look at, since the server won't say.
  const [showWhatToCheck, setShowWhatToCheck] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkChildForm>({
    resolver: zodResolver(linkChildFormSchema),
    defaultValues: { schoolId: "", lrn: "", lastName: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined);
    setShowWhatToCheck(false);

    link.mutate(values, {
      onSuccess: () => router.replace("/home"),
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          setFormError(strings.errors.unexpected);
          return;
        }

        setFormError(error.message);
        setShowWhatToCheck(error.code === "not_found");
      },
    });
  });

  const schoolOptions = (schools.data ?? []).map((school) => ({
    value: school.id,
    label: school.name,
  }));

  return (
    <FormScreen>
      <View style={{ gap: theme.space.xs }}>
        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fontFamily.headingBold,
            fontSize: theme.fontSize.xl,
          }}
        >
          {strings.linkChild.heading}
        </Text>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fontFamily.body,
            fontSize: theme.fontSize.base,
          }}
        >
          {strings.linkChild.subheading}
        </Text>
      </View>

      {schools.isError ? (
        // The form cannot be filled in without the list, so say so rather
        // than showing an empty picker.
        <View style={{ alignItems: "center", gap: theme.space.base }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: theme.colors.destructive,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.base,
              textAlign: "center",
            }}
          >
            {schools.error instanceof ApiError
              ? schools.error.message
              : strings.linkChild.schoolsFailed}
          </Text>
          <TextLink
            label={strings.errors.tryAgain}
            onPress={() => schools.refetch()}
          />
        </View>
      ) : schools.data === undefined ? (
        <View style={{ alignItems: "center", paddingVertical: theme.space.xl }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <View style={{ gap: theme.space.base }}>
          <Controller
            control={control}
            name="schoolId"
            render={({ field }) => (
              <SelectField
                label={strings.linkChild.schoolLabel}
                placeholder={strings.linkChild.schoolPlaceholder}
                sheetTitle={strings.linkChild.schoolPickerTitle}
                options={schoolOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.schoolId?.message}
                disabled={link.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="lrn"
            render={({ field }) => (
              <Field
                label={strings.linkChild.lrnLabel}
                placeholder={strings.linkChild.lrnPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.lrn?.message}
                keyboardType="number-pad"
                editable={!link.isPending}
              />
            )}
          />

          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.xs,
            }}
          >
            {strings.linkChild.lrnHint}
          </Text>

          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <Field
                label={strings.linkChild.lastNameLabel}
                placeholder={strings.linkChild.lastNamePlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.lastName?.message}
                autoCapitalize="words"
                editable={!link.isPending}
              />
            )}
          />

          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DateField
                label={strings.linkChild.birthDateLabel}
                placeholder={strings.linkChild.birthDatePlaceholder}
                value={field.value}
                onChange={field.onChange}
                error={errors.birthDate?.message}
                disabled={link.isPending}
              />
            )}
          />
        </View>
      )}

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
          {showWhatToCheck ? (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.fontFamily.body,
                fontSize: theme.fontSize.sm,
              }}
            >
              {strings.linkChild.checkTheseAgain}
            </Text>
          ) : null}
        </View>
      )}

      <View style={{ gap: theme.space.md }}>
        <Button
          label={strings.linkChild.submit}
          busyLabel={strings.linkChild.submitting}
          busy={link.isPending}
          disabled={schools.data === undefined}
          onPress={onSubmit}
        />

        <View style={{ alignItems: "center" }}>
          <TextLink
            label={strings.linkChild.cancel}
            onPress={() => router.back()}
          />
        </View>
      </View>
    </FormScreen>
  );
}
