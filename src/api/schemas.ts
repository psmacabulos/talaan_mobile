/**
 * Every answer from the server is checked here before the app uses it
 * (CLAUDE.md, "Validate every answer").
 *
 * `z.object` drops keys it doesn't know, which is exactly what the contract
 * asks for: "a new field may be added at any time, since the app ignores
 * fields it doesn't know" (docs/TALAAN-API.md). So a field added by the server
 * can never break a phone already in a parent's hands.
 *
 * Schemas arrive with the step that needs them. M2 only talks to
 * `GET /schools`, so only that shape is here.
 */
import { z } from "zod";

/** The one error shape every failure uses (docs/TALAAN-API.md, "Errors"). */
export const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    // Zod 4 needs both the key and the value schema; the one-argument form
    // runs but fails `tsc`.
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

/** `GET /api/v1/parents/schools` → `200 { schools: [{ id, name }] }` */
export const schoolSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type School = z.infer<typeof schoolSchema>;

export const schoolsResponseSchema = z.object({
  schools: z.array(schoolSchema),
});

/** The parent themselves (docs/TALAAN-API.md:67). */
export const parentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  mobile: z.string(),
});

export type Parent = z.infer<typeof parentSchema>;

/** `POST /signup` → `201 { token, parent }`, `POST /login` → `200` the same. */
export const authResponseSchema = z.object({
  token: z.string(),
  parent: parentSchema,
});

export type AuthResult = z.infer<typeof authResponseSchema>;


/**
 * A child as the server describes them today (docs/TALAAN-API.md).
 *
 * Everything a phone can ever know about a child is here. The LRN, the birth
 * date and the card serial are never sent back (docs/PRODUCT-RULES.md).
 */
export const childTodaySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  /** 7 to 12 — Bantay Aral is a high school system. */
  gradeLevel: z.number(),
  section: z.string(),
  /** A path like "/api/v1/photos/…", loaded with the same token. */
  photo: z.string().nullable(),
  school: z.object({
    id: z.string(),
    name: z.string(),
    notificationPreference: z.enum([
      "off",
      "time_in_only",
      "time_in_and_time_out",
    ]),
  }),
  today: z.object({
    date: z.string(),
    status: z.enum(["present", "late", "absent", "idle"]),
    /** A weekend: no late and no absent. */
    flexible: z.boolean(),
    /** The first tap: the arrival, which present or late comes from. */
    timeIn: z.string().nullable(),
    /** The last tap, only when it is a time out: none after in, out, in. */
    timeOut: z.string().nullable(),
    tapCount: z.number(),
    /**
     * The newest tap, and whether the server counted it as an in or an out
     * (Talaan Step 59.3). `null` with no tap; with one tap, the time in.
     *
     * `undefined` means an older server that doesn't send it, or a value the
     * app can't read. Either way the card falls back to its time in and time
     * out, rather than losing the whole child to `tolerantArray` below.
     */
    latest: z
      .object({
        at: z.string(),
        kind: z.enum(["time_in", "time_out"]),
      })
      .nullable()
      .optional()
      .catch(undefined),
  }),
});

export type ChildToday = z.infer<typeof childTodaySchema>;

/**
 * Children, checked one at a time, with anything unrecognisable dropped.
 *
 * A plain `z.array(childTodaySchema)` would fail the whole answer over one odd
 * child — a status we don't know yet, a null where a string was promised —
 * and `/me` failing takes the entire signed-in app with it. One child the app
 * can't read should cost that child's card, not the parent's session.
 */
function tolerantArray<T>(schema: z.ZodType<T>) {
  return z
    .array(z.unknown())
    .optional()
    .transform((items) =>
      (items ?? []).flatMap((item) => {
        const parsed = schema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    );
}

const tolerantChildren = tolerantArray(childTodaySchema);

/**
 * `POST /children` → `201 { child: ChildToday }`.
 *
 * The child is read tolerantly on purpose. A `201` means the link was made on
 * the server; if the app then rejected the body the parent would see a failure
 * for something that worked, retry, and be told the child is already linked.
 * A child that doesn't parse becomes `null` and the confirmation simply says
 * less.
 */
export const linkChildResponseSchema = z
  .object({ child: z.unknown() })
  .transform(({ child }) => {
    const parsed = childTodaySchema.safeParse(child);
    return parsed.success ? parsed.data : null;
  });
/**
 * `GET /me` → `{ parent, children: [ChildToday] }`.
 *
 * Only `parent` is described here. Zod drops `children` on the way through,
 * which is deliberate: M3 has no use for it, and an unexpected child shape
 * must never be able to stop a parent signing in. M5 adds it when Home needs
 * it.
 */
export const meResponseSchema = z.object({
  parent: parentSchema,
  children: tolerantChildren,
});

export type MeResult = z.infer<typeof meResponseSchema>;

/**
 * One line in the feed: "Juan Cruz tapped in at 7:56 AM".
 *
 * `childName` is the full name here; a push uses the first name only
 * (docs/PRODUCT-RULES.md:24).
 */
export const notificationSchema = z.object({
  id: z.string(),
  childId: z.string(),
  childName: z.string(),
  kind: z.enum(["time_in", "time_out"]),
  at: z.string(),
  read: z.boolean(),
});

export type Notification = z.infer<typeof notificationSchema>;

/**
 * `GET /notifications` → one page of the feed.
 *
 * `unreadCount` **stops at 10**: ten means "ten or more", which is why the
 * badge reads "9+" from there and why the app can never work the real number
 * out by subtracting (docs/TALAAN-API.md).
 *
 * `nextBefore` is opaque. It is handed back exactly as it arrived and is never
 * built or read by the app; `null` means this was the last page.
 */
export const feedPageSchema = z.object({
  notifications: tolerantArray(notificationSchema),
  unreadCount: z.number(),
  nextBefore: z.string().nullable(),
});

export type FeedPage = z.infer<typeof feedPageSchema>;

/** One tap at the gate. The server decides which are arrivals. */
export const tapSchema = z.object({
  at: z.string(),
  kind: z.enum(["time_in", "time_out"]),
});

export type Tap = z.infer<typeof tapSchema>;

/**
 * `GET /children/:id/taps` → one child's day.
 *
 * `status` and `flexible` are the same pair the card on Home uses, so the day
 * screen can show the same pill and the same weekend words.
 */
export const childDaySchema = z.object({
  date: z.string(),
  status: z.enum(["present", "late", "absent", "idle"]),
  flexible: z.boolean(),
  taps: tolerantArray(tapSchema),
});

export type ChildDay = z.infer<typeof childDaySchema>;
