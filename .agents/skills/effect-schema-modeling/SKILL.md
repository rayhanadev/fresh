---
name: effect-schema-modeling
description: Defines runtime-validated domain models with Effect Schema and decodes unknown input at boundaries. Use when adding entities, parsing external data, or validating tool/API payloads.
---

# Effect Schema Modeling

Use this skill to model domain data once for both static types and runtime validation.

## When To Use

- New domain entities or command payloads
- Parsing API responses or untrusted input
- Replacing ad-hoc manual validation logic
- Enforcing invariants at module boundaries

## Prerequisite Checks

- Identify all untrusted boundaries (`HTTP`, queue, tool input, file input).
- Identify required invariants (formats, enums, optional fields, timestamps).
- Confirm where decode failures should map to typed domain errors.

## Modeling Rules

- Define entities with `Schema.Struct(...)` and composable Schema primitives.
- Derive types from schemas (`type X = typeof X.Type`).
- Decode unknown input at boundaries with `Schema.decodeUnknownSync(...)` or Effect decoders.
- Prefer Effect Standard Schema support first; use Zod only when integration requires it.
- Use `Schema.DateTimeUtc` for timestamp fields when applicable.

## Workflow

1. Accept `unknown` only at validation entry points.
2. Define request/entity schemas with domain names, not transport names.
3. Decode immediately at the boundary.
4. Map decode errors to typed domain failures when needed.
5. Pass strongly typed values through internal logic.
6. Reuse schemas for both runtime decode and static type derivation.

## Patterns To Follow

- Keep schema declarations near domain modules.
- Use small composable schemas for repeated fields.
- Add transform schemas only when transformation is part of domain rules.
- Keep decode functions as the only place `unknown` enters business logic.

## Anti-Patterns

- Accepting untyped objects deep in service code.
- Repeating manual field validation in multiple modules.
- Using schema decode only in tests but not production boundaries.
- Returning raw decode errors directly from user-facing APIs without mapping.

## Example: Decode At Boundary + Typed Error

```typescript
import { Effect, Schema } from "effect";

class InvalidWebhookPayloadError extends Schema.TaggedError<InvalidWebhookPayloadError>(
  "InvalidWebhookPayloadError",
)({
  message: Schema.String,
  cause: Schema.optional(Schema.Defect),
}) {}

const CreateUser = Schema.Struct({
  email: Schema.String,
  name: Schema.optional(Schema.String),
  createdAt: Schema.DateTimeUtc,
});

type CreateUser = typeof CreateUser.Type;

const decodeCreateUser = Schema.decodeUnknown(CreateUser);

const createUserInputFromUnknown = (input: unknown): Effect.Effect<CreateUser, InvalidWebhookPayloadError> =>
  decodeCreateUser(input).pipe(
    Effect.mapError((cause) =>
      new InvalidWebhookPayloadError({
        message: "Webhook payload did not match CreateUser schema",
        cause,
      }),
    ),
  );
```

## Verification Checklist

- Every untrusted boundary decodes once before business logic.
- Domain types are derived from schemas, not duplicated manually.
- Decode failures are mapped to typed domain errors where required.
- Timestamp fields use `Schema.DateTimeUtc` where applicable.
- No lazy `unknown` flows remain in internal logic.

## References

- https://effect.website/docs/schema/standard-schema/
- https://effect-ts.github.io/effect/effect/Schema.ts.html
- https://effect-ts.github.io/effect/effect/Effect.ts.html
- https://effect.website/docs/schema/introduction/
