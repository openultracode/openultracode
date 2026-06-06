import { resolve } from "node:path";

import { loadConfig } from "../src/config.js";
import { createDryRunPlan } from "../src/planner.js";
import { inspectRepository } from "../src/repo-inspector.js";

const plannerFixtureRoot = (name: string): string =>
  resolve(process.cwd(), "tests", "fixtures", "planner", name);

test("fixture app splits mixed source, test, and docs goals", async () => {
  const config = await loadConfig(process.cwd());
  const inspection = await inspectRepository(plannerFixtureRoot("mixed-typescript-app"));

  const plan = createDryRunPlan({
    runId: "run_fixture_mixed",
    goal: "implement route caching, add tests, and update README docs",
    config,
    inspection,
    createdAt: "2026-06-05T21:00:00.000Z"
  });

  expect(inspection.packageManager).toBe("npm");
  expect(inspection.summary.languageHints).toEqual(["typescript"]);
  expect(inspection.summary.hasTests).toBe(true);
  expect(plan.tasks).toHaveLength(3);
  expect(plan.tasks[0]).toMatchObject({
    id: "task_1",
    intent: "edit",
    modelTier: "strong",
    dependsOn: [],
    fileScope: ["package.json", "src/app.ts", "src/router.ts"]
  });
  expect(plan.tasks[1]).toMatchObject({
    id: "task_2",
    intent: "test",
    modelTier: "strong",
    dependsOn: ["task_1"],
    fileScope: ["tests/app.test.ts"]
  });
  expect(plan.tasks[2]).toMatchObject({
    id: "task_3",
    intent: "edit",
    modelTier: "strong",
    dependsOn: ["task_1", "task_2"],
    fileScope: ["README.md", "docs/usage.md"]
  });
  expect(plan.fileOwnership).toEqual({
    hasConflicts: false,
    files: [
      {
        path: "docs/usage.md",
        ownerTaskIds: ["task_3"],
        conflict: false
      },
      {
        path: "package.json",
        ownerTaskIds: ["task_1"],
        conflict: false
      },
      {
        path: "README.md",
        ownerTaskIds: ["task_3"],
        conflict: false
      },
      {
        path: "src/app.ts",
        ownerTaskIds: ["task_1"],
        conflict: false
      },
      {
        path: "src/router.ts",
        ownerTaskIds: ["task_1"],
        conflict: false
      }
    ],
    conflicts: []
  });
  expect(plan.estimatedCostUsd).toBe(0.03);
});

test("fixture docs repo keeps docs-only goals out of source and tests", async () => {
  const config = await loadConfig(process.cwd());
  const inspection = await inspectRepository(plannerFixtureRoot("docs-only-site"));

  const plan = createDryRunPlan({
    runId: "run_fixture_docs",
    goal: "update README documentation",
    config,
    inspection,
    createdAt: "2026-06-05T21:01:00.000Z"
  });

  expect(inspection.summary.hasTests).toBe(true);
  expect(plan.tasks).toHaveLength(1);
  expect(plan.tasks[0]).toMatchObject({
    id: "task_1",
    title: "Document: update README documentation",
    intent: "edit",
    modelTier: "strong",
    dependsOn: [],
    fileScope: ["README.md", "docs/setup.md"]
  });
  expect(plan.tasks[0].fileScope).not.toContain("PROJECT_STATUS.md");
  expect(plan.tasks[0].fileScope).not.toContain("src/site.ts");
  expect(plan.tasks[0].fileScope).not.toContain("tests/site.test.ts");
  expect(plan.estimatedCostUsd).toBe(0.01);
});

test("fixture app routes audit goals through free models with inspected scope", async () => {
  const config = await loadConfig(process.cwd());
  const inspection = await inspectRepository(plannerFixtureRoot("mixed-typescript-app"));

  const plan = createDryRunPlan({
    runId: "run_fixture_audit",
    goal: "audit this fixture app for TODOs",
    config,
    inspection,
    createdAt: "2026-06-05T21:02:00.000Z"
  });

  expect(plan.tasks).toHaveLength(1);
  expect(plan.tasks[0]).toMatchObject({
    id: "task_1",
    intent: "research",
    modelTier: "free",
    fileScope: [
      "PROJECT_STATUS.md",
      "README.md",
      "docs/usage.md",
      "package-lock.json",
      "package.json",
      "src/app.ts",
      "src/router.ts",
      "tests/app.test.ts"
    ]
  });
  expect(plan.routes.task_1.primary.backend).toBe(config.profiles.balanced.free.backend);
  expect(plan.estimatedCostUsd).toBe(0);
});
