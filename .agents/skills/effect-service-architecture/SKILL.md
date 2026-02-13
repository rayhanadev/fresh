---
name: effect-service-architecture
description: Designs non-trivial Effect modules using Effect.Service with generated tags and layers, dependency wiring, and one provide boundary. Use when introducing reusable capabilities, external integrations, or resource-managed components.
---

# Effect Service Architecture

Use this skill to model capabilities with `Effect.Service` first, then compose layers at the application boundary.
This reflects the Layer docs guidance for simplifying service definitions with `Effect.Service`.

## When To Use

- Introducing a reusable capability (repository, client, adapter)
- Wiring multiple dependencies into one workflow
- Managing resources that need acquisition and release
- Refactoring logic that currently uses scattered `Effect.provide(...)`

## Prerequisite Checks

- Confirm the capability is reused across modules or operations.
- Confirm dependencies can be consumed through Effect context.
- Confirm there is a single bootstrap boundary for layer provisioning.

## Preferred Pattern: `Effect.Service`

Define services with:

- `sync` or `succeed` for static services
- `effect` for dynamic construction
- `scoped` for lifecycle-managed resources
- `dependencies` for automatic dependency wiring
- `accessors: true` when static accessor functions improve ergonomics

Generated artifacts from `Effect.Service`:

- The service tag itself (use with `yield* ServiceName`)
- `.Default` layer
- `.DefaultWithoutDependencies` when `dependencies` are defined
- `.make`/`.use` helpers and optional accessors

## Workflow

1. Define the service as `class X extends Effect.Service<X>()("X", { ... }) {}`.
2. Choose constructor mode: `sync`, `succeed`, `effect`, or `scoped`.
3. Declare `dependencies` instead of manually threading layers when possible.
4. Keep business programs dependent on service interfaces only.
5. Provide composed layers once at the application boundary.
6. In tests, replace dependencies/services with test layers.

## Example: Simplified Service Definition

```typescript
import { Effect } from "effect";

class Prefix extends Effect.Service<Prefix>()("Prefix", {
  sync: () => ({ prefix: "PRE" }),
}) {}

class Logger extends Effect.Service<Logger>()("Logger", {
  accessors: true,
  effect: Effect.gen(function* () {
    const { prefix } = yield* Prefix;
    return {
      info: (message: string) =>
        Effect.sync(() => {
          console.log(`[${prefix}] ${message}`);
        }),
    };
  }),
  dependencies: [Prefix.Default],
}) {}

const program = Logger.info("service started").pipe(
  Effect.provide(Logger.Default),
);
```

## Testing And Mocking With Service Layers

When dependencies are declared, use `.DefaultWithoutDependencies` to inject test dependencies.

```typescript
import { Effect, Layer } from "effect";

const PrefixTest = Layer.succeed(
  Prefix,
  { prefix: "TEST" } as const,
);

const testProgram = Logger.info("hello").pipe(
  Effect.provide(Logger.DefaultWithoutDependencies),
  Effect.provide(PrefixTest),
);
```

For direct service replacement tests:

```typescript
const LoggerTest = Layer.succeed(
  Logger,
  {
    info: (_: string) => Effect.void,
  } as const,
);
```

## `Effect.Service` vs `Context.Tag`

Use `Effect.Service` by default when you want tag + layer generation and simpler setup.
Use `Context.Tag` directly for advanced custom patterns where auto-generated layers/accessors are not desired.

## Anti-Patterns

- Building service tags manually when `Effect.Service` would suffice.
- Providing layers deep in business logic instead of app bootstrap.
- Mixing construction styles inconsistently without clear rationale.
- Returning untyped (`any`/lazy `unknown`) service APIs.

## Verification Checklist

- Service classes use `Effect.Service` with an intentional constructor mode.
- Dependencies are declared via `dependencies` where appropriate.
- `.Default` is used at runtime bootstrap.
- Tests use layer overrides (`.DefaultWithoutDependencies` or direct replacement layers).
- Business logic depends on service contracts, not concrete implementations.

## References

- https://effect.website/docs/requirements-management/layers/#simplifying-service-definitions-with-effectservice
- https://effect.website/docs/requirements-management/layers/
- https://effect-ts.github.io/effect/effect/Effect.ts.html
- https://effect-ts.github.io/effect/effect/Layer.ts.html
- https://effect-ts.github.io/effect/effect/Context.ts.html
