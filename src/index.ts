import { Effect, Layer, Logger, Match } from "effect";
import { AppEnv } from "./env";

export const greeting = Effect.fn("greeting")((str: string) => Effect.succeed(`Hello ${str}`));

const program = Effect.gen(function* () {
  const env = yield* AppEnv;
  const message = yield* greeting(env.appName);
  yield* Effect.log(message);
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
