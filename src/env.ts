/* oxlint-disable */

import { Env, makeEnv } from "@rayhanadev/env";

export const AppEnv = makeEnv("AppEnv", {
  nodeEnv: Env.stringOr("NODE_ENV", "development"),
  appName: Env.stringOr("APP_NAME", "__PROJECT_NAME__"),
});
