---
name: setup-tests
description: Installs and configures Vitest and @effect/vitest from scratch, including scripts, coverage thresholds, and baseline test structure. Use when a repository lacks a working test harness and the user asks to set it up.
---

# Setup Tests

Use this skill to bootstrap or repair the test harness for a TypeScript + Effect repository.

## When To Use

- The repo has no test runner configured.
- `bun run test` or `bun run test:coverage` does not exist.
- `@effect/vitest` is missing for Effect-first tests.
- Coverage settings are missing or below required policy.

Only run this setup when the user asks for test-harness installation or repair.

## Prerequisites

- Package manager is Bun.
- TypeScript project already exists (`tsconfig.json` present).
- User approved dependency and config changes.

## Setup Steps

1. Install required dev dependencies.

```bash
bun add -d vitest @effect/vitest @vitest/coverage-v8
```

2. Ensure test scripts exist in `package.json`.

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

3. Add `vitest.config.ts` with explicit include/exclude and coverage policy.

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["src/env.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

4. Validate scaffold-level conventions.

- Co-locate tests as `src/**/*.test.ts`.
- Use `@effect/vitest` for Effect-centric tests.
- Use `vi` from `vitest` for mocks and env stubs.
- Keep quality-gate scripts available: `test`, `test:watch`, `test:coverage`.

5. Add a baseline test only if no tests exist yet.

```typescript
import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

describe("smoke", () => {
  it.effect("runs Effect test harness", () =>
    Effect.gen(function* () {
      expect(1 + 1).toBe(2);
    }),
  );
});
```

6. Run the full verification commands.

```bash
bun run typecheck
bun run lint
bun run test
bun run test:coverage
```

7. If the template was intentionally stripped of test scaffolding, reintroduce:

- `vitest`, `@effect/vitest`, `@vitest/coverage-v8` dev dependencies
- `test`, `test:watch`, `test:coverage` scripts
- `vitest.config.ts`
- at least one `src/**/*.test.ts` file

## Troubleshooting

- Missing coverage provider:
  - Verify `@vitest/coverage-v8` is installed.
- ESM/CJS import errors:
  - Confirm `package.json` `type` and `tsconfig` module settings are compatible with Vitest.
- Coverage below threshold:
  - Add tests for missing branches before lowering thresholds.
- Effect tests not recognized:
  - Confirm imports come from `@effect/vitest`, not plain `vitest`, for Effect test files.

## Hand-Off To Other Skills

- After setup succeeds, use `write-tests` for feature and bug-test implementation.
- If tracing/log correlation is also requested, use `setup-otel`.

## References

- https://vitest.dev/guide/
- https://vitest.dev/config/
- https://vitest.dev/guide/coverage
- https://effect-ts.github.io/effect/docs/vitest
- https://www.npmjs.com/package/@effect/vitest
