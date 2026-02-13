---
name: effect-error-modeling
description: Models domain failures as typed Effect errors using Schema.TaggedError and applies targeted recovery operators. Use when adding failure modes, integration boundaries, or error-handling behavior.
---

# Effect Error Modeling

Use this skill to keep failures typed, explicit, and recoverable without ad-hoc `Error` classes.

## When To Use

- Adding new domain failure cases
- Converting thrown exceptions into typed failures
- Refactoring catch-all handlers into targeted recovery
- Defining errors for public APIs

## Prerequisite Checks

- Identify expected domain failures vs unexpected defects.
- Verify where thrown exceptions can cross boundaries.
- Confirm error tags and payload fields needed by callers.

## Modeling Rules

- Define domain errors with `Schema.TaggedError` in `src/errors.ts`.
- Include structured fields that support handling and debugging.
- Use `Effect.fail(...)` with typed errors for expected domain failures.
- Keep optional defect causes in a `cause` field when needed.
- Export public error classes from `src/index.ts`.

## Workflow

1. Enumerate failure modes for the use case.
2. Define one tagged error per meaningful recovery path.
3. Convert thrown/rejected failures at integration boundaries (`Effect.try`, `Effect.tryPromise`).
4. Propagate typed errors through service interfaces.
5. Recover with `catchTag`/`catchTags` where business fallback is required.
6. Log at boundaries with typed error metadata; avoid duplicated mid-stack logging.
7. Add tests for each error tag and recovery branch.

## Recovery Rules

- Use `Effect.catchTag(...)` for one specific error type.
- Use `Effect.catchTags(...)` for multiple typed branches.
- Use `Effect.catchAll(...)` only when broad fallback is intentional.
- Preserve context when mapping one failure to another.

## Anti-Patterns

- Throwing plain `Error` for domain failures.
- Creating one generic error tag for unrelated failures.
- Using `catchAll` for everything, removing typed recovery.
- Dropping root cause details while mapping failures.

## Example: Boundary Mapping + Typed Recovery

```typescript
import { Effect, Schema } from "effect";

class SessionNotFoundError extends Schema.TaggedError<SessionNotFoundError>(
  "SessionNotFoundError",
)({
  sessionId: Schema.String,
  cause: Schema.optional(Schema.Defect),
}) {}

class SessionStoreError extends Schema.TaggedError<SessionStoreError>("SessionStoreError")({
  message: Schema.String,
}) {}

const loadSession = (sessionId: string): Effect.Effect<Session, SessionNotFoundError | SessionStoreError> =>
  Effect.tryPromise({
    try: () => db.sessions.find(sessionId),
    catch: () =>
      new SessionStoreError({
        message: "Failed to query session store",
      }),
  }).pipe(
    Effect.flatMap((session) =>
      session
        ? Effect.succeed(session)
        : Effect.fail(
            new SessionNotFoundError({
              sessionId,
              cause: new Error("Missing row in sessions table"),
            }),
          ),
    ),
  );

const loadSessionOrCreateGuest = (sessionId: string) =>
  loadSession(sessionId).pipe(
    Effect.catchTag("SessionNotFoundError", () => createGuestSession(sessionId)),
  );
```

## Verification Checklist

- Every domain failure has a typed tagged error.
- Boundary exceptions are mapped into typed errors.
- Recovery logic is tag-specific and intentional.
- Error payloads include actionable context.
- Tests cover each error tag and fallback path.

## References

- https://effect-ts.github.io/effect/effect/Schema.ts.html
- https://effect-ts.github.io/effect/effect/Effect.ts.html
- https://effect.website/docs/error-management/introduction/
- https://effect.website/docs/data-types/data/
