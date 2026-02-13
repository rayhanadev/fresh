---
name: observability-wide-events
description: Emits wide structured events for Effect operations with operation context, timing, outcomes, and stable fields instead of chatty narrow logs. Use when implementing or changing business workflows, adapters, retries, or error boundaries.
---

# Observability Wide Events

Use this skill to log one high-signal event per operation with enough context to debug without reconstructing from many small messages.

## When To Use

- Adding or modifying a workflow step
- Instrumenting adapters and integration boundaries
- Improving production debugging signal
- Replacing narrow or repetitive logs

## Setup Prerequisite

Do not perform OpenTelemetry or collector installation in this skill.
If tracing/log export is missing, invoke `setup-otel` first, then return here for event design.

## Event Contract Checklist

- Include operation identity, input context, and output summary.
- Include `duration_ms` for latency analysis.
- Include outcome fields such as `status`, `error_tag`, and retry metadata.
- Keep keys stable and machine-parsable.
- Keep values low-cardinality where possible.
- Prefer business fields over debug-only noise.

## Workflow

1. Define a stable event schema for the operation before writing logs.
2. Wrap the operation with `Effect.fn("DomainService.method")`.
3. Capture immutable context with `Effect.annotateCurrentSpan(...)` once near operation start.
4. Record start time once and compute `duration_ms` exactly once.
5. Emit one success event with output summary fields.
6. Emit one failure event with typed error tag and failure summary.
7. Verify field names stay stable across retries and code paths.

## Patterns To Follow

- One wide event at completion beats many narrow progress logs.
- Keep domain identifiers in a normalized shape (`*_id`, `*_type`, `*_count`).
- Include decision context (`cache_hit`, `retry_count`, `source`) when relevant.
- Treat event shape changes as contract changes and review carefully.

## Anti-Patterns

- Logging every intermediate variable at `info` level.
- Emitting different key names for the same concept across code paths.
- Storing raw payloads with high-cardinality or sensitive content.
- Omitting duration and status fields.

## Example: Wide Success And Failure Events

```typescript
import { Effect } from "effect";

const syncUsers = Effect.fn("UserSync.syncUsers")(function* (batchId: string) {
  const startedAt = Date.now();

  yield* Effect.annotateCurrentSpan({
    operation: "user_sync",
    batch_id: batchId,
  });

  return yield* loadUsers(batchId).pipe(
    Effect.tap((users) =>
      Effect.logInfo("user sync completed", {
        operation: "user_sync",
        batch_id: batchId,
        user_count: users.length,
        duration_ms: Date.now() - startedAt,
        status: "ok",
      }),
    ),
    Effect.tapErrorTag("NotionFsError", (error) =>
      Effect.logError("user sync failed", {
        operation: "user_sync",
        batch_id: batchId,
        error_tag: error._tag,
        duration_ms: Date.now() - startedAt,
        status: "error",
      }),
    ),
  );
});
```

## Verification Checklist

- Each major operation emits one completion event with stable keys.
- Events include status, duration, and operation identifiers.
- Failure events include typed error tags.
- No narrow-log spam or high-cardinality payload dumping.
- Output is useful for dashboards and incident timelines.

## References

- `setup-otel` skill in `.agents/skills/setup-otel/SKILL.md`
- https://effect-ts.github.io/effect/effect/Logger.ts.html
- https://effect-ts.github.io/effect/effect/Effect.ts.html
- https://effect-ts.github.io/effect/effect/Tracer.ts.html
- https://opentelemetry.io/docs/specs/semconv/
