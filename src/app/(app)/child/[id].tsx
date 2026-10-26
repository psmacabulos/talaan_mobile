/**
 * One child's day: every tap, not just the first and last.
 *
 * Home shows a time in and a time out because that is what a parent usually
 * wants. A child can leave and come back — a dentist appointment, a fever sent
 * home at eleven — and then the pair of times on the card stops telling the
 * whole story. This screen is where the rest of it lives.
 *
 * The server labels each tap as an arrival or a departure by its order in the
 * day, and the app shows what it is given (CLAUDE.md, "The backend is
 * somewhere else").
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import type { Tap } from "@/api/schemas";
import { useMe } from "@/auth/session";
import { useSession } from "@/auth/session-context";
import { useChildDay } from "@/children/use-children";
import { statusLabel } from "@/children/status-words";
import { StatusPill } from "@/components/child/status-pill";
import { TextLink } from "@/components/form/text-link";
import { Skeleton } from "@/components/skeleton";
import { formatSchoolTime } from "@/lib/school-time";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function ChildDayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasToken } = useSession();

  const day = useChildDay(id);
  // The name comes from the list already in the cache, so this screen needs
  // no extra request to know whose day it is showing.
  const me = useMe(hasToken === true);
  const child = me.data?.children.find((candidate) => candidate.id === id);

  const notFound = day.error instanceof ApiError && day.error.code === "not_found";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: theme.space.base,
          padding: theme.space.base,
        }}
      >
        <TextLink label={strings.childDay.back} onPress={() => router.back()} />

        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fontFamily.headingBold,
            fontSize: theme.fontSize.lg,
          }}
        >
          {child === undefined
            ? strings.childDay.title
            : `${child.firstName} ${child.lastName}`}
        </Text>

        {day.isError ? (
          <View style={{ alignItems: "center", gap: theme.space.base, padding: theme.space.xl }}>
            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: theme.colors.destructive,
                fontFamily: theme.fontFamily.body,
                fontSize: theme.fontSize.base,
                textAlign: "center",
              }}
            >
              {notFound
                ? strings.childDay.notFound
                : day.error instanceof ApiError
                  ? day.error.message
                  : strings.errors.unexpected}
            </Text>
            {notFound ? null : (
              <TextLink
                label={strings.errors.tryAgain}
                onPress={() => void day.refetch()}
              />
            )}
          </View>
        ) : day.data === undefined ? (
          <View style={{ gap: theme.space.sm }}>
            <Skeleton height={32} width={120} radius={theme.radius.sm} />
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} height={56} radius={theme.radius.md} />
            ))}
          </View>
        ) : (
          <View style={{ gap: theme.space.base }}>
            <StatusPill
              label={statusLabel({
                status: day.data.status,
                flexible: day.data.flexible,
              })}
            />

            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fontFamily.headingBold,
                fontSize: theme.fontSize.base,
              }}
            >
              {strings.childDay.taps}
            </Text>

            {day.data.taps.length === 0 ? (
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.fontFamily.body,
                  fontSize: theme.fontSize.base,
                }}
              >
                {strings.childDay.noTaps}
              </Text>
            ) : (
              day.data.taps.map((tap, index) => (
                <TapRow key={`${tap.at}-${index}`} tap={tap} />
              ))
            )}
          </View>
        )}

        {day.isFetching && day.data !== undefined ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** "Tapped in — 7:56 AM". The server decided which it is. */
function TapRow({ tap }: { tap: Tap }) {
  const theme = useTheme();
  const tone = tap.kind === "time_in" ? theme.status.present : theme.status.timeOut;
  const label =
    tap.kind === "time_in" ? strings.childDay.tappedIn : strings.childDay.tappedOut;

  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${formatSchoolTime(tap.at) ?? ""}`}
      style={{
        alignItems: "center",
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: theme.space.md,
        minHeight: theme.minTouchTarget,
        padding: theme.space.base,
      }}
    >
      <View
        style={{
          backgroundColor: tone.background,
          borderRadius: theme.radius.sm,
          height: 10,
          width: 10,
        }}
      />
      <Text
        style={{
          color: theme.colors.mutedForeground,
          flex: 1,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.sm,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors.foreground,
          // Lexend for every number and time (docs/DESIGN.md).
          fontFamily: theme.fontFamily.heading,
          fontSize: theme.fontSize.base,
        }}
      >
        {formatSchoolTime(tap.at) ?? strings.card.noTime}
      </Text>
    </View>
  );
}
