import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

import type { BackendKind, CucConfig } from "./types.js";

const backendSchema = z.enum(["openrouter", "claude-cli", "codex-cli", "fake"]);

const singleModelEndpointSchema = z.strictObject({
  backend: backendSchema,
  model: z.string().min(1)
});

const multiModelEndpointSchema = z.strictObject({
  backend: backendSchema,
  models: z.array(z.string().min(1)).min(1)
});

const profileSchema = z.strictObject({
  orchestrator: singleModelEndpointSchema,
  critical: singleModelEndpointSchema,
  strong: singleModelEndpointSchema,
  cheap: singleModelEndpointSchema,
  free: multiModelEndpointSchema
});

const limitsSchema = z.strictObject({
  maxWorkers: z.number().int().positive(),
  maxCostUsd: z.number().nonnegative(),
  maxTasks: z.number().int().positive(),
  requirePlanApproval: z.boolean()
});

const patchApplicationSchema = z.strictObject({
  applyCleanPatches: z.boolean()
});

export const configSchema = z
  .strictObject({
    activeProfile: z.string().min(1),
    profiles: z.record(z.string(), profileSchema),
    limits: limitsSchema,
    patchApplication: patchApplicationSchema
  })
  .superRefine((config, context) => {
    if (!config.profiles[config.activeProfile]) {
      context.addIssue({
        code: "custom",
        path: ["activeProfile"],
        message: `Profile "${config.activeProfile}" is not defined`
      });
    }
  });

export const DEFAULT_CONFIG = {
  activeProfile: "balanced",
  profiles: {
    balanced: {
      orchestrator: {
        backend: "openrouter" as BackendKind,
        model: "openai/gpt-oss-120b"
      },
      critical: {
        backend: "claude-cli" as BackendKind,
        model: "opus"
      },
      strong: {
        backend: "codex-cli" as BackendKind,
        model: "gpt-5.3-codex"
      },
      cheap: {
        backend: "openrouter" as BackendKind,
        model: "deepseek/deepseek-v4-flash"
      },
      free: {
        backend: "openrouter" as BackendKind,
        models: [
          "qwen/qwen3-coder:free",
          "nvidia/nemotron-3-super-120b-a12b:free",
          "qwen/qwen3-next-80b-a3b-instruct:free",
          "moonshotai/kimi-k2.6:free",
          "openai/gpt-oss-120b:free"
        ]
      }
    }
  },
  limits: {
    maxWorkers: 16,
    maxCostUsd: 5,
    maxTasks: 100,
    requirePlanApproval: true
  },
  patchApplication: {
    applyCleanPatches: false
  }
} satisfies CucConfig;

export async function loadConfig(projectRoot: string): Promise<CucConfig> {
  const configPath = join(projectRoot, ".ouc", "config.json");
  const projectConfig = await readProjectConfig(configPath);
  const merged = deepMerge(DEFAULT_CONFIG, projectConfig);
  const parsed = configSchema.safeParse(merged);

  if (!parsed.success) {
    throw new Error(`Invalid config at ${configPath}: ${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}

async function readProjectConfig(configPath: string): Promise<unknown> {
  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {};
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid config JSON at ${configPath}: ${error.message}`);
    }
    throw error;
  }
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (Array.isArray(base) || Array.isArray(override)) {
    return override === undefined ? base : override;
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override;
  }

  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    output[key] = deepMerge(output[key], value);
  }
  return output;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
