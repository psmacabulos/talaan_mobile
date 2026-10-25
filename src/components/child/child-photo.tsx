/**
 * A child's photo, in a 4:5 box.
 *
 * The photo is private: `GET /api/v1/photos/<key>` only answers with the
 * parent's own token, and every other photo is a `404`
 * (docs/TALAAN-API.md). `expo-image` takes the header on its source, which is
 * the one place in the app that needs the token without being able to wait
 * for the keystore — hence `getTokenNow()`.
 *
 * **A photo that fails never signs anyone out.** This request does not go
 * through `src/api/client.ts`, so a `401` here never reaches the one error
 * handler and never clears the session. That is deliberate: a parent on a
 * patchy connection should see a grey box with their child's initials, not be
 * thrown back to the sign-in screen. A real dead token is caught by `/me`,
 * which does go through the client.
 *
 * Photos are shown and never kept anywhere a parent could export them: never
 * saved to the gallery, never shared (CLAUDE.md, "Students are minors").
 */
import { useState } from "react";

import { Image } from "expo-image";
import { Text, View } from "react-native";

import { getBaseUrl } from "@/api/config";
import type { ChildToday } from "@/api/schemas";
import { getTokenNow } from "@/api/token";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

type ChildPhotoProps = {
  child: ChildToday;
  /** The box's width. Height follows at 4:5, never cropped differently. */
  width: number;
};

/** "JP" — something recognisable while the photo is missing. */
function initials(child: ChildToday): string {
  return `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`.toUpperCase();
}

function photoUrl(path: string): string | undefined {
  try {
    return `${getBaseUrl()}${path}`;
  } catch {
    // No server address configured. The rest of the card is still worth
    // showing, so this is a missing photo rather than an error.
    return undefined;
  }
}

export function ChildPhoto({ child, width }: ChildPhotoProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  const height = Math.round((width * 5) / 4);
  const token = getTokenNow();
  const url = child.photo === null ? undefined : photoUrl(child.photo);
  const canShow = url !== undefined && token !== null && !failed;

  const box = {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.base,
    height,
    overflow: "hidden" as const,
    width,
  };

  if (!canShow) {
    return (
      <View
        accessibilityLabel={strings.card.photoOf(child.firstName)}
        accessibilityRole="image"
        style={{ ...box, alignItems: "center", justifyContent: "center" }}
      >
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fontFamily.heading,
            fontSize: theme.fontSize.md,
          }}
        >
          {initials(child)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={strings.card.photoOf(child.firstName)}
      accessibilityRole="image"
      source={{ uri: url, headers: { Authorization: `Bearer ${token}` } }}
      // The server gives a new path whenever the photo changes and marks it
      // immutable, so it is safe to keep. Memory as well as disk, or it is
      // decoded again on every remount while a parent scrolls.
      cachePolicy="memory-disk"
      contentFit="cover"
      onError={() => setFailed(true)}
      style={box}
    />
  );
}
