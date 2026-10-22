/**
 * Putting the server's complaints in front of the parent.
 *
 * An `invalid_input` answer carries a message per field
 * (docs/TALAAN-API.md, "Errors"), and those belong under the fields they name.
 *
 * The part worth being careful about: the server can name a field this form
 * does not have. `deviceLabel` is sent with every sign-in and is not on any
 * form; a future field would be the same. Writing that message onto a field
 * that isn't rendered shows the parent **nothing at all** — the request
 * failed, the spinner stopped, and no reason appeared anywhere.
 *
 * So anything that doesn't land on a field is reported back, and the screen
 * shows the error's own message instead.
 */
import type { ApiError } from "@/api/errors";

type SetFieldError<TName extends string> = (
  name: TName,
  error: { message: string },
) => void;

/**
 * Returns true when at least one message found a home. False means the screen
 * should show `error.message` itself, because the parent would otherwise see
 * no explanation.
 */
export function applyServerFieldErrors<TName extends string>(
  error: ApiError,
  formFields: readonly TName[],
  setFieldError: SetFieldError<TName>,
): boolean {
  if (error.fields === undefined) {
    return false;
  }

  let landed = false;

  for (const [field, message] of Object.entries(error.fields)) {
    if ((formFields as readonly string[]).includes(field)) {
      setFieldError(field as TName, { message });
      landed = true;
    }
  }

  return landed;
}
