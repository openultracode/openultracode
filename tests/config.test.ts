import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
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

  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /Invalid config at .*\.ouc\/config\.json/
  );
  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /profiles\.balanced\.free\.backend/
  );
});

test("loadConfig rejects unknown config keys with the nested path", async () => {
  const projectRoot = await makeTempProject();
  const configDir = join(projectRoot, ".ouc");
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, "config.json"),
    JSON.stringify({
      limits: {
        maxWorker: 4
      },
      unknownTopLevel: true
    })
  );

  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /Invalid config at .*\.ouc\/config\.json/
  );
  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /Unrecognized key: "unknownTopLevel"/
  );
  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /Unrecognized key: "maxWorker"/
  );
  await expect(loadConfig(projectRoot)).rejects.toThrow(/at limits/);
});

test("loadConfig supports a custom active routing profile with default fallback profile still present", async () => {
  const projectRoot = await makeTempProject();
  const configDir = join(projectRoot, ".ouc");
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, "config.json"),
    JSON.stringify(
      {
        activeProfile: "advanced-fake",
        profiles: {
          "advanced-fake": {
            orchestrator: {
              backend: "fake",
              model: "fake-orchestrator"
            },
            critical: {
              backend: "fake",
              model: "fake-critical"
            },
            strong: {
              backend: "fake",
              model: "fake-strong"
            },
            cheap: {
              backend: "fake",
              model: "fake-cheap"
            },
            free: {
              backend: "fake",
              models: ["fake-free-a", "fake-free-b"]
            }
          }
        },
        limits: {
          maxWorkers: 2,
          maxCostUsd: 0,
          maxTasks: 8,
          requirePlanApproval: false
        }
      },
      null,
      2
    )
  );

  const config = await loadConfig(projectRoot);

  expect(config.activeProfile).toBe("advanced-fake");
  expect(config.profiles["advanced-fake"].free.models).toEqual([
    "fake-free-a",
    "fake-free-b"
  ]);
  expect(config.profiles.balanced).toBeDefined();
  expect(config.limits.requirePlanApproval).toBe(false);
  expect(config.patchApplication.applyCleanPatches).toBe(false);
});

test("loadConfig rejects an active profile that is not defined", async () => {
  const projectRoot = await makeTempProject();
  const configDir = join(projectRoot, ".ouc");
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, "config.json"),
    JSON.stringify({
      activeProfile: "missing-profile",
      profiles: {}
    })
  );

  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /Profile "missing-profile" is not defined/
  );
});

test("loadConfig rejects duplicate free models in advanced routing profiles", async () => {
  const projectRoot = await makeTempProject();
  const configDir = join(projectRoot, ".ouc");
  await mkdir(configDir, { recursive: true });
  await writeFile(
    join(configDir, "config.json"),
    JSON.stringify({
      profiles: {
        balanced: {
          free: {
            backend: "openrouter",
            models: ["qwen/qwen3-coder:free", "qwen/qwen3-coder:free"]
          }
        }
      }
    })
  );

  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /profiles\.balanced\.free\.models/
  );
  await expect(loadConfig(projectRoot)).rejects.toThrow(
    /Free tier models must be unique/
  );
});

test("example config files load through the real config parser", async () => {
  const examplesRoot = resolve(process.cwd(), "examples");
  const exampleFiles = (await readdir(examplesRoot))
    .filter((file) => file.endsWith(".json"))
    .sort();

  expect(exampleFiles).toEqual([
    "config.advanced-routing.json",
    "config.local-cli.json",
    "config.openrouter-budget.json",
    "config.safe-fake.json"
  ]);

  for (const file of exampleFiles) {
    const projectRoot = await makeTempProject();
    const configDir = join(projectRoot, ".ouc");
    await mkdir(configDir, { recursive: true });
    await copyFile(join(examplesRoot, file), join(configDir, "config.json"));

    const config = await loadConfig(projectRoot);

    expect(config.profiles[config.activeProfile]).toBeDefined();
    expect(config.patchApplication.applyCleanPatches).toBe(false);
  }
});
