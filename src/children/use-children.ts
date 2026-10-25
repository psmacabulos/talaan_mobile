/**
 * The school list, and linking a child.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSchools, linkChild } from "@/api/endpoints";
import { ApiError } from "@/api/errors";
import { ME_KEY } from "@/auth/session";
import { toCalendarDate } from "@/lib/calendar-date";

import type { LinkChildForm } from "./form-schema";

export const SCHOOLS_KEY = ["schools"] as const;

/**
 * Every Bantay Aral school.
 *
 * Schools don't change during a session, so this is kept for a day and not
 * re-asked when the app returns to the foreground. The form can't be filled
 * in without it, so the screen shows its own loading and error states rather
 * than an empty picker.
 */
export function useSchools() {
  return useQuery({
    queryKey: SCHOOLS_KEY,
    queryFn: getSchools,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Link a child, then ask `/me` again.
 *
 * Refetching rather than writing the new child straight into the cache: one
 * cheap call, no chance of the cache drifting from what the server would say,
 * and it refreshes the 30-day token at the same time.
 *
 * A `409` ("already linked") refetches too. The child really is linked, and a
 * stale list is the most likely reason the parent tried to add them twice.
 */
export function useLinkChild() {
  const queryClient = useQueryClient();

  const refreshChildren = () =>
    queryClient.invalidateQueries({ queryKey: ME_KEY });

  return useMutation({
    mutationFn: (form: LinkChildForm) =>
      linkChild({
        schoolId: form.schoolId,
        lrn: form.lrn,
        lastName: form.lastName,
        birthDate: toCalendarDate(form.birthDate),
      }),
    onSuccess: refreshChildren,
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.code === "conflict") {
        void refreshChildren();
      }
    },
  });
}
