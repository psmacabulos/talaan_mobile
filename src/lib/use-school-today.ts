/**
 * The school's date now, "2026-10-26", held once for a whole screen.
 *
 * One value for the screen, not one per row: the feed's section headers and
 * the rows under them must agree, even when a render straddles midnight. It is
 * read again whenever the app comes back to the foreground, and whenever the
 * screen calls `refresh` (on pull to refresh), so a feed left open overnight
 * catches up.
 */
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { schoolDateOf } from "./school-time";

function readToday(): string {
  return schoolDateOf(new Date().toISOString());
}

export function useSchoolToday(): { today: string; refresh: () => void } {
  const [today, setToday] = useState(readToday);

  const refresh = useCallback(() => setToday(readToday()), []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => subscription.remove();
  }, [refresh]);

  return { today, refresh };
}
