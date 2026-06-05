import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { FakeBackend } from "./backends/fake.js";
import { loadConfig } from "./config.js";
import { createDryRunPlan, type DryRunPlan } from "./planner.js";
import { inspectRepository } from "./repo-inspector.js";
import { createRunArtifacts } from "./run-artifacts.js";
import type { CucConfig, Task, WorkerResult } from "./types.js";

export type CliRuntime = {
  cwd: string;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
};

type RunLimitViolation = {
  kind: "maxTasks" | "maxCostUsd";
  reason: string;
};

const HELP = `OpenUltraCode

Usage:
  ouc plan "<goal>"
  ouc run "<goal>"
  ouc status <run-id>
  ouc report <run-id>

Options:
  --help       Show this help.
`;

export async function runCli(
  argv: string[],
  runtime: CliRuntime
): Promise<number> {
  const args = argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    runtime.stdout(HELP.trimEnd());
    return 0;
  }

  if (command === "plan") {
    return runPlan(args.slice(1), runtime);
  }

  if (command === "run") {
    return runRun(args.slice(1), runtime);
  }

  if (command === "status") {
    return runStatus(args.slice(1), runtime);
  }

  if (command === "report") {
    return runReport(args.slice(1), runtime);
  }

  runtime.stderr(`Command "${command}" is not implemented yet.`);
  runtime.stderr("Run `ouc --help` for available commands.");
  return 1;
}

async function runPlan(args: string[], runtime: CliRuntime): Promise<number> {
  const parsed = parsePlanArgs(args);

  if (parsed.error) {
    runtime.stderr(parsed.error);
    return 1;
  }

  if (!parsed.goal) {
    runtime.stderr('Usage: ouc plan "<goal>"');
    return 1;
  }

  const config = await loadConfig(runtime.cwd);
  const inspection = await inspectRepository(runtime.cwd);
  const artifacts = await createRunArtifacts(runtime.cwd, parsed.runId);
  const plan = createDryRunPlan({
    runId: artifacts.runId,
    goal: parsed.goal,
    config,
    inspection
  });
  const ledgerEntry = {
    event: "plan_created",
    runId: artifacts.runId,
    createdAt: plan.createdAt,
    taskCount: plan.tasks.length,
    estimatedCostUsd: plan.estimatedCostUsd
  };

  await writeFile(artifacts.planPath, `${JSON.stringify(plan, null, 2)}\n`);
  await writeFile(artifacts.ledgerPath, `${JSON.stringify(ledgerEntry)}\n`);

  if (parsed.json) {
    runtime.stdout(
      JSON.stringify(
        {
          runId: artifacts.runId,
          goal: plan.goal,
          taskCount: plan.tasks.length,
          estimatedCostUsd: plan.estimatedCostUsd,
          planPath: artifacts.planPath,
          ledgerPath: artifacts.ledgerPath
        },
        null,
        2
      )
    );
    return 0;
  }

  runtime.stdout(`Created dry-run plan ${artifacts.runId}`);
  runtime.stdout(artifacts.planPath);
  return 0;
}

async function runRun(args: string[], runtime: CliRuntime): Promise<number> {
  const parsed = parseRunArgs(args);

  if (parsed.error) {
    runtime.stderr(parsed.error);
    return 1;
  }

  if (!parsed.goal) {
    runtime.stderr('Usage: ouc run "<goal>" --backend fake');
    return 1;
  }

  if (parsed.backend !== "fake") {
    runtime.stderr("Only --backend fake is implemented right now.");
    return 1;
  }

  const config = await loadConfig(runtime.cwd);
  const inspection = await inspectRepository(runtime.cwd);
  const artifacts = await createRunArtifacts(runtime.cwd, parsed.runId);

  if (await fileExists(artifacts.finalReportPath)) {
    runtime.stderr(`Run "${artifacts.runId}" already has a final report.`);
    return 1;
  }

  const plan = createDryRunPlan({
    runId: artifacts.runId,
    goal: parsed.goal,
    config,
    inspection
  });
  const ledgerEntries: Array<Record<string, unknown>> = [
    {
      event: "plan_created",
      runId: artifacts.runId,
      createdAt: plan.createdAt,
      taskCount: plan.tasks.length,
      estimatedCostUsd: plan.estimatedCostUsd
    }
  ];
  const results: WorkerResult[] = [];

  await writeFile(artifacts.planPath, `${JSON.stringify(plan, null, 2)}\n`);
  const limitViolation = findRunLimitViolation(plan, config);

  if (limitViolation) {
    ledgerEntries.push({
      event: "run_blocked",
      runId: artifacts.runId,
      status: "blocked",
      reason: limitViolation.reason,
      limit: limitViolation.kind,
      taskCount: plan.tasks.length,
      estimatedCostUsd: plan.estimatedCostUsd,
      blockedAt: new Date().toISOString()
    });
    await writeLedger(artifacts.ledgerPath, ledgerEntries);
    const report = renderBlockedReport(plan, limitViolation);
    await writeFile(artifacts.finalReportPath, `${report}\n`);

    if (parsed.json) {
      runtime.stdout(
        JSON.stringify(
          {
            runId: artifacts.runId,
            status: "blocked",
            reason: limitViolation.reason,
            taskCount: plan.tasks.length,
            succeeded: 0,
            failed: 0,
            totalCostUsd: 0,
            planPath: artifacts.planPath,
            ledgerPath: artifacts.ledgerPath,
            finalReportPath: artifacts.finalReportPath
          },
          null,
          2
        )
      );
      return 1;
    }

    runtime.stdout(`Run ${artifacts.runId} blocked`);
    runtime.stdout(limitViolation.reason);
    runtime.stdout(artifacts.finalReportPath);
    return 1;
  }

  for (const task of plan.tasks) {
    const startedAt = new Date().toISOString();
    ledgerEntries.push({
      event: "task_started",
      runId: artifacts.runId,
      taskId: task.id,
      modelTier: task.modelTier,
      startedAt
    });

    const backend = new FakeBackend({ backend: "fake", model: "fake-model" });
    const result = await backend.run(task);
    results.push(result);
    await writeWorkerArtifacts(artifacts.workersDir, task, result);

    ledgerEntries.push({
      event: "task_finished",
      runId: artifacts.runId,
      taskId: task.id,
      status: result.status,
      totalTokens: result.usage.totalTokens,
      costUsd: result.costUsd,
      finishedAt: new Date().toISOString()
    });
  }

  const succeeded = results.filter((result) => result.status === "succeeded").length;
  const failed = results.length - succeeded;
  const status = failed === 0 ? "succeeded" : "failed";
  ledgerEntries.push({
    event: "run_finished",
    runId: artifacts.runId,
    status,
    taskCount: plan.tasks.length,
    succeeded,
    failed,
    totalCostUsd: sumCosts(results),
    finishedAt: new Date().toISOString()
  });

  await writeLedger(artifacts.ledgerPath, ledgerEntries);
  const report = renderExecutionReport(plan, results, status);
  await writeFile(artifacts.finalReportPath, `${report}\n`);

  if (parsed.json) {
    runtime.stdout(
      JSON.stringify(
        {
          runId: artifacts.runId,
          status,
          taskCount: plan.tasks.length,
          succeeded,
          failed,
          totalCostUsd: sumCosts(results),
          planPath: artifacts.planPath,
          ledgerPath: artifacts.ledgerPath,
          finalReportPath: artifacts.finalReportPath
        },
        null,
        2
      )
    );
    return 0;
  }

  runtime.stdout(`Run ${artifacts.runId} ${status}`);
  runtime.stdout(artifacts.finalReportPath);
  return status === "succeeded" ? 0 : 1;
}

async function runStatus(args: string[], runtime: CliRuntime): Promise<number> {
  const parsed = parseStatusArgs(args);
  const runId = parsed.runId;

  if (!runId) {
    runtime.stderr("Usage: ouc status <run-id>");
    return 1;
  }

  const loaded = await loadPlanArtifact(runtime.cwd, runId, runtime);
  if (!loaded) {
    return 1;
  }

  const { plan, planPath } = loaded;
  const runDir = join(runtime.cwd, ".ouc", "runs", runId);
  const ledgerPresent = await fileExists(join(runDir, "ledger.jsonl"));
  const finalReportPresent = await fileExists(join(runDir, "final-report.md"));

  if (parsed.json) {
    runtime.stdout(
      JSON.stringify(
        {
          runId: plan.runId,
          goal: plan.goal,
          taskCount: plan.tasks.length,
          estimatedCostUsd: plan.estimatedCostUsd,
          ledgerPresent,
          finalReportPresent,
          planPath
        },
        null,
        2
      )
    );
    return 0;
  }

  runtime.stdout(`Run: ${plan.runId}`);
  runtime.stdout(`Goal: ${plan.goal}`);
  runtime.stdout(`Tasks: ${plan.tasks.length} planned`);
  runtime.stdout(`Estimated cost: $${plan.estimatedCostUsd.toFixed(2)}`);
  runtime.stdout(`Ledger: ${ledgerPresent ? "present" : "missing"}`);
  runtime.stdout(`Final report: ${finalReportPresent ? "present" : "missing"}`);
  runtime.stdout(`Plan: ${planPath}`);
  return 0;
}

async function runReport(args: string[], runtime: CliRuntime): Promise<number> {
  const runId = args[0];

  if (!runId) {
    runtime.stderr("Usage: ouc report <run-id>");
    return 1;
  }

  const loaded = await loadPlanArtifact(runtime.cwd, runId, runtime);
  if (!loaded) {
    return 1;
  }

  const reportPath = join(
    runtime.cwd,
    ".ouc",
    "runs",
    runId,
    "final-report.md"
  );
  const existingReport = await readOptionalFile(reportPath);

  if (existingReport !== undefined) {
    runtime.stdout(existingReport.trimEnd());
    return 0;
  }

  const report = renderPlanReport(loaded.plan);

  await writeFile(reportPath, `${report}\n`);
  runtime.stdout(report);
  return 0;
}

async function loadPlanArtifact(
  cwd: string,
  runId: string,
  runtime: CliRuntime
): Promise<{ plan: DryRunPlan; planPath: string } | undefined> {
  const planPath = join(cwd, ".ouc", "runs", runId, "plan.json");

  try {
    return {
      plan: JSON.parse(await readFile(planPath, "utf8")) as DryRunPlan,
      planPath
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      runtime.stderr(`Run "${runId}" was not found.`);
      return undefined;
    }
    throw error;
  }
}

function renderPlanReport(plan: DryRunPlan): string {
  const taskLines = plan.tasks.map((task) => {
    const route = plan.routes[task.id];
    const routeText = route
      ? `${route.primary.backend}:${route.primary.model}`
      : "unrouted";
    return `- ${task.id}: ${task.title} (${task.intent}, ${task.modelTier}, ${routeText})`;
  });

  return [
    "# OpenUltraCode Run Report",
    "",
    `- Run: \`${plan.runId}\``,
    `- Goal: ${plan.goal}`,
    `- Created: ${plan.createdAt}`,
    `- Planned tasks: ${plan.tasks.length}`,
    `- Estimated cost: $${plan.estimatedCostUsd.toFixed(2)}`,
    "",
    "## Tasks",
    "",
    ...taskLines,
    "",
    "## Execution",
    "",
    "No worker execution has run yet."
  ].join("\n");
}

function renderExecutionReport(
  plan: DryRunPlan,
  results: WorkerResult[],
  status: string
): string {
  const resultByTask = new Map(results.map((result) => [result.taskId, result]));
  const taskLines = plan.tasks.map((task) => {
    const result = resultByTask.get(task.id);
    const resultText = result
      ? `${result.status}, ${result.usage.totalTokens} tokens, $${result.costUsd.toFixed(2)}`
      : "not run";
    return `- ${task.id}: ${task.title} (${task.intent}, ${task.modelTier}) - ${resultText}`;
  });
  const succeeded = results.filter((result) => result.status === "succeeded").length;
  const failed = results.length - succeeded;

  return [
    "# OpenUltraCode Run Report",
    "",
    `- Run: \`${plan.runId}\``,
    `- Goal: ${plan.goal}`,
    `- Created: ${plan.createdAt}`,
    `- Status: ${status}`,
    `- Planned tasks: ${plan.tasks.length}`,
    `- Succeeded tasks: ${succeeded}`,
    `- Failed tasks: ${failed}`,
    `- Total cost: $${sumCosts(results).toFixed(2)}`,
    "",
    "## Tasks",
    "",
    ...taskLines,
    "",
    "## Execution",
    "",
    "Fake backend execution completed locally."
  ].join("\n");
}

function renderBlockedReport(
  plan: DryRunPlan,
  violation: RunLimitViolation
): string {
  const taskLines = plan.tasks.map((task) => (
    `- ${task.id}: ${task.title} (${task.intent}, ${task.modelTier})`
  ));

  return [
    "# OpenUltraCode Run Report",
    "",
    `- Run: \`${plan.runId}\``,
    `- Goal: ${plan.goal}`,
    `- Created: ${plan.createdAt}`,
    "- Status: blocked",
    `- Planned tasks: ${plan.tasks.length}`,
    `- Estimated cost: ${formatUsd(plan.estimatedCostUsd)}`,
    `- Blocked reason: ${violation.reason}`,
    "",
    "## Tasks",
    "",
    ...taskLines,
    "",
    "## Execution",
    "",
    "Run stopped before worker execution."
  ].join("\n");
}

async function writeWorkerArtifacts(
  workersDir: string,
  task: Task,
  result: WorkerResult
): Promise<void> {
  const taskDir = join(workersDir, task.id);
  await mkdir(taskDir, { recursive: true });
  await writeFile(join(taskDir, "response.md"), `${result.response}\n`);
  await writeFile(join(taskDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
}

async function writeLedger(
  ledgerPath: string,
  entries: Array<Record<string, unknown>>
): Promise<void> {
  await writeFile(
    ledgerPath,
    `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`
  );
}

function findRunLimitViolation(
  plan: DryRunPlan,
  config: CucConfig
): RunLimitViolation | undefined {
  if (plan.tasks.length > config.limits.maxTasks) {
    return {
      kind: "maxTasks",
      reason: `Planned task count ${plan.tasks.length} exceeds limits.maxTasks ${config.limits.maxTasks}.`
    };
  }

  if (plan.estimatedCostUsd > config.limits.maxCostUsd) {
    return {
      kind: "maxCostUsd",
      reason: `Estimated cost ${formatUsd(plan.estimatedCostUsd)} exceeds limits.maxCostUsd ${formatUsd(config.limits.maxCostUsd)}.`
    };
  }

  return undefined;
}

function sumCosts(results: WorkerResult[]): number {
  return Number(
    results.reduce((sum, result) => sum + result.costUsd, 0).toFixed(6)
  );
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function parsePlanArgs(args: string[]): {
  goal: string;
  runId?: string;
  json: boolean;
  error?: string;
} {
  const goalParts: string[] = [];
  let runId: string | undefined;
  let json = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--run-id") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) {
        return {
          goal: goalParts.join(" ").trim(),
          json,
          error: "--run-id requires a value"
        };
      }
      runId = args[index + 1];
      index += 1;
      continue;
    }

    goalParts.push(arg);
  }

  return {
    goal: goalParts.join(" ").trim(),
    runId,
    json
  };
}

function parseRunArgs(args: string[]): {
  goal: string;
  runId?: string;
  backend: "fake";
  json: boolean;
  error?: string;
} {
  const goalParts: string[] = [];
  let runId: string | undefined;
  let backend: "fake" = "fake";
  let json = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--run-id") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) {
        return {
          goal: goalParts.join(" ").trim(),
          backend,
          json,
          error: "--run-id requires a value"
        };
      }
      runId = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--backend") {
      if (args[index + 1] !== "fake") {
        return {
          goal: goalParts.join(" ").trim(),
          backend,
          json,
          error: "Only --backend fake is implemented right now."
        };
      }
      backend = "fake";
      index += 1;
      continue;
    }

    goalParts.push(arg);
  }

  return {
    goal: goalParts.join(" ").trim(),
    runId,
    backend,
    json
  };
}

function parseStatusArgs(args: string[]): { runId?: string; json: boolean } {
  const filtered = args.filter((arg) => arg !== "--json");
  return {
    runId: filtered[0],
    json: filtered.length !== args.length
  };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function readOptionalFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}
