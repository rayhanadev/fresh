---
name: setup-effect
description: Installs and configures Effect and @effect/language-service, then scaffolds AppEnv and a baseline Effect runtime entrypoint.
---

# Setup Effect

Use this skill when a project should switch from a basic TypeScript scaffold to an Effect-first scaffold.

## When To Use

- The user asks to enable Effect in a non-Effect template.
- `effect` and `@effect/language-service` are not installed.
- `package.json` and `tsconfig.json` are missing Effect language-service setup.
- `src/env.ts` and `src/index.ts` need Effect bootstrap scaffolding.

## Prerequisites

- Package manager is Bun.
- `src/env.ts`, `src/index.ts`, `package.json`, and `tsconfig.json` exist.
- The user approved dependency and config changes.

## Setup Steps

1. Install dependencies.

```bash
bun add effect @rayhanadev/env
bun add -d @effect/language-service
```

2. Add prepare script to `package.json`.

```json
{
  "scripts": {
    "prepare": "effect-language-service patch"
  }
}
```

3. Add language service plugin to `tsconfig.json`.

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@effect/language-service" }]
  }
}
```

4. Replace `src/env.ts` with the Effect env scaffold.

```typescript
/* oxlint-disable */

import { Env, makeEnv } from "@rayhanadev/env";

export const AppEnv = makeEnv("AppEnv", {
  nodeEnv: Env.stringOr("NODE_ENV", "development"),
  appName: Env.stringOr("APP_NAME", "__PROJECT_NAME__"),
});
```

5. Replace `src/index.ts` with the baseline Effect program scaffold.

```typescript
import { Effect, Layer, Logger, Match } from "effect";
import { AppEnv } from "./env";

const program = Effect.gen(function* () {
  /* user code */
});

const LoggerLayer = Effect.gen(function* () {
  const env = yield* AppEnv;
  return env.nodeEnv;
}).pipe(
  Effect.andThen((nodeEnv) =>
    Match.value(nodeEnv).pipe(
      Match.when("development", () => Logger.pretty),
      Match.when("production", () => Logger.json),
      Match.when("test", () => Logger.pretty),
      Match.orElseAbsurd,
    ),
  ),
  Layer.unwrapEffect,
);

const AppLayer = Layer.mergeAll(AppEnv.Default, Layer.provide(LoggerLayer, AppEnv.Default));

const main = program.pipe(Effect.provide(AppLayer));

Effect.runSync(main);
```

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
