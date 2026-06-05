import type { CucConfig, Task, TaskRoute } from "./types.js";
import type { RepositoryInspection } from "./repo-inspector.js";
import { classifyTask, routeTask } from "./router.js";

export type DryRunPlan = {
  runId: string;
  goal: string;
  createdAt: string;
  repo: RepositoryInspection;
  tasks: Task[];
  routes: Record<string, TaskRoute>;
  estimatedCostUsd: number;
  notes: string[];
};

export type CreateDryRunPlanInput = {
  runId: string;
  goal: string;
  config: CucConfig;
  inspection: RepositoryInspection;
  createdAt?: string;
};

export function createDryRunPlan(input: CreateDryRunPlanInput): DryRunPlan {
  const tasks = createInitialTasks(input.goal, input.inspection);
  const routes = Object.fromEntries(
    tasks.map((task) => [task.id, routeTask(task, input.config)])
  );

  return {
    runId: input.runId,
    goal: input.goal,
    createdAt: input.createdAt ?? new Date().toISOString(),
    repo: input.inspection,
    tasks,
    routes,
    estimatedCostUsd: estimatePlanCost(Object.values(routes)),
    notes: [
      "Deterministic local dry-run plan. Real orchestrator parsing is not wired yet."
    ]
  };
}

function createInitialTasks(goal: string, inspection: RepositoryInspection): Task[] {
  const intent = inferIntent(goal);
  const importance = intent === "edit" || intent === "test" ? "normal" : "normal";

  if (intent === "edit") {
    return [
      {
        id: "task_1",
        title: `Implement: ${summarizeGoal(goal)}`,
        intent: "edit",
        importance,
        modelTier: classifyTask({ intent: "edit", importance }),
        fileScope: sourceFiles(inspection.files),
        dependsOn: [],
        instructions: [
          `Goal: ${goal}`,
          "Make the requested code changes within the scoped source files."
        ].join("\n")
      },
      {
        id: "task_2",
        title: `Verify: ${summarizeGoal(goal)}`,
        intent: "test",
        importance,
        modelTier: classifyTask({ intent: "test", importance }),
        fileScope: testFiles(inspection.files),
        dependsOn: ["task_1"],
        instructions: [
          `Goal: ${goal}`,
          "Add or update focused tests for the implementation task."
        ].join("\n")
      }
    ];
  }

  return [{
    id: "task_1",
    title: summarizeGoal(goal),
    intent,
    importance,
    modelTier: classifyTask({ intent, importance }),
    fileScope: inspection.files.slice(0, 30),
    dependsOn: [],
    instructions: [
      `Goal: ${goal}`,
      `Inspect the scoped files and produce findings only.`
    ].join("\n")
  }];
}

function inferIntent(goal: string): Task["intent"] {
  const normalized = goal.toLowerCase();

  if (/\b(fix|add|change|update|implement|write|create)\b/.test(normalized)) {
    return "edit";
  }
  if (/\b(test|spec|verify)\b/.test(normalized)) {
    return "test";
  }
  if (/\b(review|audit|inspect)\b/.test(normalized)) {
    return "research";
  }
  if (/\b(summary|summarize|explain)\b/.test(normalized)) {
    return "summarize";
  }
  return "research";
}

function summarizeGoal(goal: string): string {
  const trimmed = goal.trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 77)}...`;
}

function sourceFiles(files: string[]): string[] {
  const implementationFiles = files
    .filter((file) => !isTestFile(file) && isImplementationFile(file))
    .slice(0, 30);
  if (implementationFiles.length > 0) {
    return implementationFiles;
  }

  const nonTestFiles = files.filter((file) => !isTestFile(file)).slice(0, 30);
  return nonTestFiles.length > 0 ? nonTestFiles : files.slice(0, 30);
}

function testFiles(files: string[]): string[] {
  const scoped = files.filter(isTestFile).slice(0, 30);
  return scoped.length > 0 ? scoped : files.slice(0, 30);
}

function isTestFile(file: string): boolean {
  return /(^|\/)(tests?|__tests__)\//.test(file) || /\.test\.[cm]?[jt]sx?$/.test(file);
}

function isImplementationFile(file: string): boolean {
  return (
    /^(bin|src)\//.test(file) ||
    /(^|\/)(package|tsconfig|vite|vitest|eslint|prettier)\.[\w.-]+$/.test(file)
  );
}

function estimatePlanCost(routes: TaskRoute[]): number {
  if (routes.every((route) => route.tier === "free")) {
    return 0;
  }
  return Number((routes.length * 0.01).toFixed(2));
}
