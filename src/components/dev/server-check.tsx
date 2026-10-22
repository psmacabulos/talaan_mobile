/**
 * A development-only line showing whether the phone can reach the server.
 *
 * M2's "done when" is that `GET /schools` works from the phone against the
 * live server (docs/PLAN.md), and the app has no screen that calls it yet.
 * This makes the result visible on the phone itself, rather than buried in the
 * Metro log.
 *
 * It renders nothing outside development, and **M4 deletes it** when the real
 * school picker takes over the same call.
 *
 * Its words are for the owner, not a parent, so they stay here rather than in
 * src/strings.ts, which is the list to be translated into Filipino later.
 */
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { getSchools } from "@/api/endpoints";
import { ApiError } from "@/api/errors";
import { useTheme } from "@/theme";

type CheckState =
  | { status: "checking" }
  | { status: "reached"; schools: number }
  | { status: "failed"; because: string };

export function ServerCheck() {
  const theme = useTheme();
  const [state, setState] = useState<CheckState>({ status: "checking" });

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    let listening = true;

    getSchools()
      .then((schools) => {
        if (listening) {
          setState({ status: "reached", schools: schools.length });
        }
      })
      .catch((error: unknown) => {
        if (listening) {
          setState({
            status: "failed",
            because:
              error instanceof ApiError
                ? `${error.message} (${error.kind})`
                : "unknown",
          });
        }
      });

    return () => {
      listening = false;
    };
  }, []);

  if (!__DEV__) {
    return null;
  }

  const line =
    state.status === "checking"
      ? "Checking the server…"
      : state.status === "reached"
        ? `Server reached — ${state.schools} schools`
        : `Server not reached — ${state.because}`;

  const color =
    state.status === "reached"
      ? theme.status.present.text
      : state.status === "failed"
        ? theme.status.absent.text
        : theme.colors.mutedForeground;

  return (
    <View
      style={{
        backgroundColor: theme.colors.muted,
        borderRadius: theme.radius.sm,
        padding: theme.space.sm,
      }}
    >
      <Text
        style={{
          color,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.xs,
          textAlign: "center",
        }}
      >
        {line}
      </Text>
    </View>
  );
}
