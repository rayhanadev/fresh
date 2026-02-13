import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    APP_NAME: z.string().default("__PROJECT_NAME__"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
