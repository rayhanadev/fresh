---
name: write-tests
description: Writes and updates deterministic tests for Effect and TypeScript modules using @effect/vitest, TestClock, dependency mocks, and coverage-driven assertions. Use when adding features, fixing bugs, refactoring behavior, or closing coverage gaps.
---

# Write Tests

Use this skill to produce reliable tests that satisfy this repository's quality gates and coverage requirements.

## When To Use

- Adding or changing behavior in `src/**`
- Fixing bugs that need regression coverage
- Refactoring code paths with branch-heavy logic
- Closing line/function/branch coverage gaps

## Setup Prerequisite

Do not install or configure test tooling in this skill.
If the repository is missing Vitest and `@effect/vitest` setup, invoke the `setup-tests` skill first.

Minimal preflight checks:

- `package.json` includes `test`, `test:watch`, and `test:coverage` scripts.
- `vitest.config.ts` exists and sets coverage thresholds.
- `devDependencies` include `vitest`, `@effect/vitest`, and `@vitest/coverage-v8`.

## Workflow

1. Read the changed module and list all behavior branches, not just the happy path.
2. Write or update co-located tests in `src/**/*.test.ts`.
3. For Effect modules, import test APIs from `@effect/vitest` and default to `it.effect(...)`.
4. Add failure-path assertions with `Effect.exit(...)` so error outcomes are explicit.
5. Use `TestClock` for all time-sensitive behavior.
6. Mock API, database, and filesystem boundaries; never make real network calls.
7. Keep test names behavior-focused (`returns X when Y`, `fails with Z when A`).
8. Run `bun run test` first, then `bun run test:coverage` to close branch gaps.
9. Finish by rerunning all mandatory gates (`typecheck`, `lint`, `test`, `test:coverage`).

## Commonly Difficult Patterns

### Mocking Effect Services With Test Layers

Prefer Layer-based mocks for Effect services over global/module monkey patching.

1. Keep production code depending on `Context.Tag` services.
2. Build a test `Layer.succeed(...)` or `Layer.effect(...)` implementation.
3. Provide the test layer only to the Effect under test.
4. Assert both returned values and interaction behavior (calls, arguments, retries).

```typescript
import { describe, expect, it } from "@effect/vitest";
import { Context, Effect, Layer, Ref, Schema } from "effect";

type User = { readonly id: string; readonly email: string };

class UserRepoError extends Schema.TaggedError<UserRepoError>("UserRepoError")({
  message: Schema.String,
}) {}

type UserRepoShape = {
  readonly findById: (id: string) => Effect.Effect<User, UserRepoError>;
};

class UserRepo extends Context.Tag("UserRepo")<UserRepo, UserRepoShape>() {}

const getUserEmail = (id: string) =>
  Effect.gen(function* () {
    const repo = yield* UserRepo;
    const user = yield* repo.findById(id);
    return user.email;
  });

describe("getUserEmail", () => {
  it.effect("uses a test layer and tracks interactions", () =>
    Effect.gen(function* () {
      const calls = yield* Ref.make<Array<string>>([]);

      const UserRepoTest = Layer.succeed(
        UserRepo,
        {
          findById: (id: string) =>
            Ref.update(calls, (existing) => [...existing, id]).pipe(
              Effect.as({ id, email: "test@example.com" }),
            ),
        } as const,
      );

      const email = yield* getUserEmail("u-1").pipe(Effect.provide(UserRepoTest));
      expect(email).toBe("test@example.com");

      const recorded = yield* Ref.get(calls);
      expect(recorded).toStrictEqual(["u-1"]);
    }),
  );
});
```

### Testing Failure Paths With Layer Overrides

Create a failing test layer to validate typed error handling.

```typescript
const UserRepoFailing = Layer.succeed(
  UserRepo,
  {
    findById: (id: string) =>
      Effect.fail(
        new UserRepoError({
          message: `missing user ${id}`,
        }),
      ),
  } as const,
);

const exit = yield* Effect.exit(getUserEmail("u-404").pipe(Effect.provide(UserRepoFailing)));
expect(exit._tag).toBe("Failure");
```

### When To Use `vi.mock(...)` Instead

Use `vi.mock(...)` for non-Effect module boundaries where dependency injection is not available.
For Effect services, prefer layer substitution because it preserves typed dependency graphs and avoids global mock leakage.

## Patterns To Follow

- Use `it.scoped(...)` or `it.scopedLive(...)` when resource lifecycle requires `Scope`.
- Keep tests deterministic and isolated from wall-clock timing.
- Use `it.live(...)` only when live services are intentionally required.
- Never commit `it.effect.only` and avoid long-lived `skip` tests.
- Do not exclude business-logic files from coverage.

## Anti-Patterns

- Asserting only success paths while leaving failure branches untested.
- Using `setTimeout`/real clock delays instead of `TestClock`.
- Calling third-party services in unit tests.
- Hiding type failures with `any` or assertion chains.

## Example: Success And Failure

```typescript
import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, TestClock } from "effect";

describe("divide", () => {
  it.effect("returns quotient for valid input", () =>
    Effect.gen(function* () {
      const result = yield* divide(4, 2);
      expect(result).toBe(2);
    }),
  );

  it.effect("fails on zero divisor", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(divide(4, 0));
      expect(exit).toStrictEqual(Exit.fail("Cannot divide by zero"));
    }),
  );

  it.effect("uses deterministic time", () =>
    Effect.gen(function* () {
      yield* TestClock.adjust("1 second");
      const result = yield* timeAwareComputation;
      expect(result).toBe("done");
    }),
  );
});
```

## Verification Checklist

- New logic has tests for success, failure, and edge branches.
- Tests are deterministic and isolated from external services.
- `bun run test` passes.
- `bun run test:coverage` meets repository thresholds.
- No committed `only`, long-lived `skip`, or flaky behavior without explicit rationale.

## References

- `setup-tests` skill in `.agents/skills/setup-tests/SKILL.md`
- https://vitest.dev/guide/
- https://vitest.dev/guide/coverage
- https://effect-ts.github.io/effect/docs/vitest
- https://effect-ts.github.io/effect/effect/Layer.ts.html
- https://effect-ts.github.io/effect/effect/Context.ts.html
- https://www.npmjs.com/package/@effect/vitest
