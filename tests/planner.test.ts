import { loadConfig } from "../src/config.js";
import { createDryRunPlan } from "../src/planner.js";
import type { RepositoryInspection } from "../src/repo-inspector.js";

test("createDryRunPlan builds routed deterministic tasks from a goal and repo inspection", async () => {
  const config = await loadConfig(process.cwd());
  const inspection: RepositoryInspection = {
    projectRoot: "/tmp/example",
    hasGit: false,
    packageManager: "npm",
    files: ["README.md", "src/index.ts", "tests/index.test.ts"],
    summary: {
      fileCount: 3,
      languageHints: ["typescript"],
      hasTests: true
    }
  };

  const plan = createDryRunPlan({
    runId: "run_test",
    goal: "audit this repo for TODOs",
    config,
    inspection,
    createdAt: "2026-06-05T17:15:00.000Z"
  });

  expect(plan.runId).toBe("run_test");
  expect(plan.goal).toBe("audit this repo for TODOs");
  expect(plan.repo.summary.languageHints).toEqual(["typescript"]);
  expect(plan.tasks).toHaveLength(1);
  expect(plan.tasks[0]).toMatchObject({
    id: "task_1",
    intent: "research",
    importance: "normal",
    modelTier: "free",
    fileScope: ["README.md", "src/index.ts", "tests/index.test.ts"]
  });
  expect(plan.routes.task_1.primary.model).toBe(
    config.profiles.balanced.free.models[0]
  );
  expect(plan.estimatedCostUsd).toBe(0);
});

test("createDryRunPlan splits edit goals into edit and dependent test tasks", async () => {
  const config = await loadConfig(process.cwd());
  const inspection: RepositoryInspection = {
    projectRoot: "/tmp/example",
    hasGit: false,
    packageManager: "npm",
    files: [
      "BUILD_DRAFT.md",
      "CHECKPOINT_LAST.md",
      "README.md",
      "src/cli.ts",
      "src/planner.ts",
      "tests/cli.test.ts"
    ],
    summary: {
      fileCount: 6,
      languageHints: ["typescript"],
      hasTests: true
    }
  };

  const plan = createDryRunPlan({
    runId: "run_edit",
    goal: "implement report command and test it",
    config,
    inspection,
    createdAt: "2026-06-05T17:23:00.000Z"
  });

  expect(plan.tasks).toHaveLength(2);
  expect(plan.tasks[0]).toMatchObject({
    id: "task_1",
    intent: "edit",
    modelTier: "strong",
    dependsOn: [],
    fileScope: ["src/cli.ts", "src/planner.ts"]
  });
  expect(plan.tasks[1]).toMatchObject({
    id: "task_2",
    intent: "test",
    modelTier: "strong",
    dependsOn: ["task_1"],
    fileScope: ["tests/cli.test.ts"]
  });
  expect(plan.routes.task_1.primary.backend).toBe("codex-cli");
  expect(plan.routes.task_2.primary.backend).toBe("codex-cli");
  expect(plan.estimatedCostUsd).toBe(0.02);
});
