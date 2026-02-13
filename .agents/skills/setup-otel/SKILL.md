---
name: setup-otel
description: Installs and configures OpenTelemetry tracing for Effect applications, including exporter wiring, environment configuration, and validation workflow. Use when telemetry is requested and the repository does not already have OTEL configured.
---

# Setup OTel

Use this skill to bootstrap OpenTelemetry tracing for an Effect repository from scratch.
This skill owns installation and baseline runtime wiring.
Instrumentation strategy belongs in `observability-tracing-otel`.

## When To Use

- The user asks to enable tracing or telemetry.
- No OTEL dependencies are present.
- No exporter endpoint or collector configuration exists.
- Existing traces are missing, incomplete, or uncorrelated with logs.

Only run this setup when the user requests telemetry installation or repair.

## Setup Goals

- Emit spans from Effect programs.
- Export spans to a backend through OTLP.
- Keep telemetry provisioning at one application boundary.
- Enable a reproducible local validation workflow.

## Prerequisites

- Confirm runtime target (`Node`, `Bun`, worker, browser).
- Confirm export destination (local collector, vendor backend, OTLP endpoint).
- Confirm service identity naming (`service.name`, environment, version).
- Confirm the user approved dependency and environment changes.

## Step 1: Install Dependencies

Start with the same package set used in Effect tracing examples.

Recommended baseline (adjust to runtime requirements):

```bash
bun add @effect/opentelemetry @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-http
```

Optional for early smoke tests:

- `@opentelemetry/sdk-trace-web` for browser targets
- `@opentelemetry/sdk-metrics` when metrics export is also requested

## Step 2: Add Telemetry Environment Fields

Follow repository rules: do not read `process.env` directly in new code.

1. Add fields to `src/env.ts` (`AppEnv`).
2. Add corresponding entries to `.env.example`.
3. Use `AppEnv` values when building telemetry configuration.

Suggested fields:

- `otelServiceName`
- `otelExporterOtlpEndpoint`
- `otelTracesSampler`
- `otelTracesSamplerArg`

## Step 3: Create A Telemetry Layer

Create a dedicated module such as `src/telemetry.ts` and keep setup at the boundary.

Console exporter variant (smoke-test friendly):

```typescript
import { NodeSdk } from "@effect/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";

export const NodeSdkLive = NodeSdk.layer(() => ({
  resource: {
    serviceName: "example-service",
  },
  spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter()),
}));
```

OTLP exporter variant (backend integration):

```typescript
import { NodeSdk } from "@effect/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

export const NodeSdkLive = NodeSdk.layer(() => ({
  resource: {
    serviceName: "example-service",
  },
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: "http://localhost:4318/v1/traces",
    }),
  ),
}));
```

## Step 4: Provide Telemetry At One Boundary

Merge/provide telemetry once at bootstrap.
Do not scatter `Effect.provide(...)` calls throughout domain modules.

```typescript
import { Effect, Layer } from "effect";

const RuntimeLayer = Layer.mergeAll(AppEnv.Default, NodeSdkLive, AppLayer);

const runnable = program.pipe(
  Effect.provide(RuntimeLayer),
);
```

## Step 5: Validate End-To-End

1. Add one small span in application code with `Effect.withSpan(...)`.
2. Trigger one request/job path.
3. Confirm spans arrive in the configured exporter/backend.
4. Confirm parent-child hierarchy and timing are plausible.

Local smoke check using console exporter:

- Run app and inspect emitted spans in terminal output.
- Verify span names and attributes match operation names.

Local visualization check using OTLP backend:

- Start a local OTLP-compatible stack (e.g. Grafana Tempo + Grafana).
- Send traces to OTLP endpoint.
- Query and inspect trace waterfall, durations, and nesting.

## Step 6: Set Initial Sampling Policy

Recommended default:

- Development: near 100% sampling for debugging.
- Production: lower ratio with parent-based sampler.
- Incident windows: temporarily increase sampling for affected paths.

## Handoff

- After setup is complete, use `observability-tracing-otel` for span architecture and instrumentation.
- Use `observability-wide-events` for wide structured event contracts.

## Troubleshooting

- No spans exported:
  - Confirm exporter URL, protocol, and network reachability.
  - Confirm telemetry layer is provided at runtime bootstrap.
  - Confirm service executes code paths wrapped by spans.
- Spans exist but no hierarchy:
  - Check context propagation across async and concurrency boundaries.
  - Ensure nested effects are wrapped with child spans intentionally.
- High telemetry cost/noise:
  - Reduce span volume and tune sampling rate.
- Sensitive data leaks:
  - Remove raw payloads and secrets from attributes/log fields.
- Missing trace/log correlation:
  - Align span attributes and log keys (`operation`, IDs, status).
  - Ensure logging includes trace context where supported.

## Verification Checklist

- Dependencies installed and locked.
- Telemetry env fields routed through `AppEnv`.
- Telemetry layer exists and is provided once at app boundary.
- At least one trace visible in console or backend.
- Trace hierarchy and durations look correct.
- Sensitive fields are not exported.

## References

- https://effect.website/docs/observability/tracing/
- https://effect-ts.github.io/effect/docs/opentelemetry
- https://effect-ts.github.io/effect/effect/Tracer.ts.html
- https://opentelemetry.io/docs/specs/otel/trace/api/
- https://opentelemetry.io/docs/specs/semconv/
- https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
- https://www.npmjs.com/package/@effect/opentelemetry
