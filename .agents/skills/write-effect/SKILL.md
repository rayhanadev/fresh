---
name: write-effect
description: Applies Effect coding best practices for env access, typed errors, Effect composition, and error boundaries.
---

# Write Effect

Use this skill when implementing or reviewing Effect-based code.

## When To Use

- Any implementation that imports `effect`.
- Any module that reads environment values from `AppEnv`.
- Any workflow that models domain failures in Effect.
- Any refactor that changes Effect runtime boundaries or layer wiring.

## Environment Access Pattern

Do not use `process.env` directly in Effect business code.
Read environment values through `AppEnv` from `src/env.ts`.

```typescript
import { Effect } from "effect";
import { AppEnv } from "./env";

const program = Effect.gen(function* () {
  const env = yield* AppEnv;
  return env.appName;
});

const runnable = program.pipe(Effect.provide(AppEnv.Default));
```

## Domain Error Pattern

Model domain failures as typed errors with `Schema.TaggedError`.

```typescript
import { Effect, Schema } from "effect";

class NotionFsError extends Schema.TaggedError<NotionFsError>("NotionFsError")({
  message: Schema.String,
  cause: Schema.optional(Schema.Defect),
}) {}

const program = Effect.fail(
  new NotionFsError({
    message: "Page not found",
    cause: new Error("Notion API returned 404"),
  }),
);
```

Store typed domain errors in `src/errors.ts` and export public ones from `src/index.ts`.

## Writing Effects

- Prefer `Effect.gen` for multi-step composition.
- Use `yield*` to execute Effects.
- For conditional failures, use `return yield* Effect.fail(...)` for narrowing.
- Prefer `Effect.fn("Service.method")` for reusable Effect functions.
- Give spans meaningful names.
- Add context with `Effect.annotateLogs` and `Effect.annotateCurrentSpan`.

Example:

```typescript
import { Effect } from "effect";

export const parseUser = Effect.fn("UserService.parseUser")((input: string) =>
  Effect.sync(() => JSON.parse(input)).pipe(
    Effect.annotateLogs("inputLength", input.length),
  ),
);
```

## Avoid `try/catch` Inside Effects

- Use `Effect.try` for sync code that may throw.
- Use `Effect.tryPromise` for async code that may reject.

```typescript
import { Effect } from "effect";

const fromDisk = Effect.try({
  try: () => Bun.file("data.json").text(),
  catch: (error: unknown) =>
    new Error(`Failed to read file: ${String(error)}`),
});

const fromApi = Effect.tryPromise({
  try: () => fetch("https://example.com/data"),
  catch: (error: unknown) =>
    new Error(`Request failed: ${String(error)}`),
});
```

## Layer Provisioning Boundary

- Provide layers once at the application boundary.
- Avoid scattering `Effect.provide(...)` through domain modules.
- Keep domain code dependency-driven and runtime wiring centralized.

## Verification

```bash
bun run typecheck
bun run lint
```

If test harness is configured:

```bash
bun run test
bun run test:coverage
```
