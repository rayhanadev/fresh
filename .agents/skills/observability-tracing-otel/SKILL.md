---
name: observability-tracing-otel
description: Instruments Effect programs with OpenTelemetry-friendly spans and attributes using Effect.fn, Effect.withSpan, and span annotations. Use when adding cross-service calls, latency-sensitive paths, or hard-to-debug execution flows.
---

# Tracing OTel

Use this skill to design high-signal tracing in Effect programs.
Model traces as execution narratives: one root operation, meaningful child spans, and consistent attributes.

## When To Use

- New external IO calls (HTTP, database, queue, filesystem)
- Performance investigations and latency budgeting
- Multi-step workflows with retries or fallbacks
- Existing paths that are hard to debug in production

## Setup Prerequisite

Do not install exporters, SDKs, or collectors in this skill.
If telemetry plumbing is missing, invoke `setup-otel` first, then return here for instrumentation.

## Tracing Model

- A trace represents one end-to-end operation.
- A span represents a single execution segment inside that operation.
- Parent-child spans capture causal relationships and latency distribution.
- Span attributes carry queryable context, not raw payload dumps.
- Logs capture business events; spans capture timing and structure.

## Span Design Rules

- Use stable names: `Service.method`, `Repository.query`, `Client.request`.
- Start one root span per request, command, job, or workflow.
- Add child spans for network calls, database operations, and expensive compute.
- Keep attributes low-cardinality and stable (`operation`, `provider`, `status`).
- Add error tags and result status fields on failure/success boundaries.
- Prefer fewer high-value spans over many noisy spans.

## Instrumentation Workflow

1. Identify operation boundary and define root span name.
2. Wrap the top-level effect with `Effect.fn(...)` and/or `Effect.withSpan(...)`.
3. Add child spans around each external or high-latency dependency.
4. Annotate root and child spans with operational context.
5. Add typed error and status attributes in failure paths.
6. Validate resulting trace waterfall for depth, causality, and latency clarity.

## Patterns To Follow

- Prefer stable attribute keys (`order_id`, `provider`, `retry_count`).
- Keep span names aligned to module boundaries (`Repository.load`, `Client.request`).
- Add a bounded number of attributes with high signal.
- Keep parent-child relationships intact through Effect composition.

## Anti-Patterns

- One giant span covering unrelated work.
- Deep span trees with no analytical value.
- Attributes containing full payload blobs or secrets.
- Replacing structured logs with spans instead of combining both.

## Example: Root Span, Child Spans, And Outcome Fields

```typescript
import { Effect } from "effect";

const processOrder = Effect.fn("OrderService.processOrder")(function* (orderId: string) {
  yield* Effect.annotateCurrentSpan({
    order_id: orderId,
    operation: "order_process",
  });

  const order = yield* Effect.withSpan("OrderRepository.load")(
    loadOrder(orderId),
  );

  const result = yield* Effect.withSpan("PaymentService.capture")(
    capturePayment(order),
  );

  yield* Effect.annotateCurrentSpan({
    payment_status: result.status,
    status: "ok",
  });

  return result;
});
```

## Example: Failure Annotation

```typescript
const processOrderSafe = (orderId: string) =>
  processOrder(orderId).pipe(
    Effect.tapErrorTag("PaymentDeclinedError", (error) =>
      Effect.annotateCurrentSpan({
        status: "error",
        error_tag: error._tag,
      }),
    ),
  );
```

## Logs As Trace Context

- Keep wide completion logs in `observability-wide-events`.
- Reuse the same identity fields in logs and spans (`order_id`, `operation`, `status`).
- Correlate logs with traces in dashboards and incident analysis.

## Nested And Concurrent Work

- For sequential work, nest spans in execution order.
- For parallel work, create child spans for each branch.
- Keep naming symmetric for fan-out tasks (`Task.fetchA`, `Task.fetchB`).
- Avoid helper-level spans unless they are operationally meaningful.

## Verification Checklist

- Root spans exist for top-level operations.
- Child spans exist for remote calls and expensive boundaries.
- Attributes include IDs, provider info, and outcome fields.
- Trace view can explain end-to-end latency without reading source code.
- Span volume is useful and bounded.
- Failure traces include typed error tags.

## References

- `setup-otel` skill in `.agents/skills/setup-otel/SKILL.md`
- `observability-wide-events` skill in `.agents/skills/observability-wide-events/SKILL.md`
- https://effect.website/docs/observability/tracing/
- https://effect-ts.github.io/effect/effect/Tracer.ts.html
- https://effect-ts.github.io/effect/effect/Effect.ts.html
- https://effect-ts.github.io/effect/docs/opentelemetry
- https://opentelemetry.io/docs/specs/otel/trace/api/
