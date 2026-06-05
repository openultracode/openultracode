import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

import { DEFAULT_CONFIG, loadConfig } from "../src/config.js";

async function makeTempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "ouc-config-"));
}

test("loadConfig returns safe defaults when no config file exists", async () => {
  const projectRoot = await makeTempProject();

  const config = await loadConfig(projectRoot);

  expect(config.activeProfile).toBe("balanced");
  expect(config.limits.maxWorkers).toBe(16);
  expect(config.limits.maxCostUsd).toBe(5);
  expect(config.limits.maxTasks).toBe(100);
  expect(config.limits.requirePlanApproval).toBe(true);
  expect(config.profiles.balanced.free.backend).toBe("openrouter");
  expect(config.profiles.balanced.free.models[0]).toBe(
    DEFAULT_CONFIG.profiles.balanced.free.models[0]
  );
});

test("loadConfig deeply merges project config over defaults", async () => {
  const projectRoot = await makeTempProject();
  const configDir = join(projectRoot, ".ouc");
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, "config.json"),
    JSON.stringify(
      {
        limits: { maxWorkers: 4, requirePlanApproval: false },
        profiles: {
          balanced: {
            cheap: {
              backend: "openrouter",
              model: "deepseek/deepseek-v4-flash"
            }
          }
        }
      },
      null,
      2
    )
  );

  const config = await loadConfig(projectRoot);

  expect(config.limits.maxWorkers).toBe(4);
  expect(config.limits.requirePlanApproval).toBe(false);
  expect(config.limits.maxCostUsd).toBe(DEFAULT_CONFIG.limits.maxCostUsd);
  expect(config.profiles.balanced.cheap.model).toBe(
    "deepseek/deepseek-v4-flash"
  );
  expect(config.profiles.balanced.strong.backend).toBe(
    DEFAULT_CONFIG.profiles.balanced.strong.backend
  );
});

test("loadConfig rejects invalid backend names", async () => {
  const projectRoot = await makeTempProject();
  const configDir = join(projectRoot, ".ouc");
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, "config.json"),
    JSON.stringify({
      profiles: {
        balanced: {
          free: {
            backend: "not-real",
            models: ["example/free"]
          }
        }
      }
    })
  );

  await expect(loadConfig(projectRoot)).rejects.toThrow(/Invalid config/);
});
