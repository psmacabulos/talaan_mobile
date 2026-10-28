/**
 * Ask "Allow notifications?" once a parent has a child to be notified about,
 * never on first launch (docs/PLAN.md, Step M7).
 *
 * It lives on Home rather than after linking, so a parent who linked a child
 * before push existed is asked too. Waits for Home to be the screen in front,
 * so the prompt doesn't open while "Link a child" is still closing. Asking at
 * most once is `askForPushPermissionOnce`'s job.
 */
import { useEffect } from "react";

import { useIsFocused } from "expo-router";

import { askForPushPermissionOnce } from "./ask-permission";

export function useAskForPushPermission(hasChildren: boolean): void {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (hasChildren && isFocused) {
      void askForPushPermissionOnce();
    }
  }, [hasChildren, isFocused]);
}
