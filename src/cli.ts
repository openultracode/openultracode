import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { loadConfig } from "./config.js";
import { createDryRunPlan, type DryRunPlan } from "./planner.js";
import { inspectRepository } from "./repo-inspector.js";
import { createRunArtifacts } from "./run-artifacts.js";

export type CliRuntime = {
  cwd: string;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
};

const HELP = `CodexUltraCode

Usage:
  cuc plan "<goal>"
  cuc run "<goal>"
  cuc status <run-id>
  cuc report <run-id>

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

  if (command === "status") {
    return runStatus(args.slice(1), runtime);
  }

  if (command === "report") {
    return runReport(args.slice(1), runtime);
  }

  runtime.stderr(`Command "${command}" is not implemented yet.`);
  runtime.stderr("Run `cuc --help` for available commands.");
  return 1;
}

async function runPlan(args: string[], runtime: CliRuntime): Promise<number> {
  const parsed = parsePlanArgs(args);

  if (parsed.error) {
    runtime.stderr(parsed.error);
    return 1;
  }

  if (!parsed.goal) {
    runtime.stderr('Usage: cuc plan "<goal>"');
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

async function runStatus(args: string[], runtime: CliRuntime): Promise<number> {
  const parsed = parseStatusArgs(args);
  const runId = parsed.runId;

  if (!runId) {
    runtime.stderr("Usage: cuc status <run-id>");
    return 1;
  }

  const loaded = await loadPlanArtifact(runtime.cwd, runId, runtime);
  if (!loaded) {
    return 1;
  }

  const { plan, planPath } = loaded;
  const runDir = join(runtime.cwd, ".codexultracode", "runs", runId);
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
    runtime.stderr("Usage: cuc report <run-id>");
    return 1;
  }

  const loaded = await loadPlanArtifact(runtime.cwd, runId, runtime);
  if (!loaded) {
    return 1;
  }

  const reportPath = join(
    runtime.cwd,
    ".codexultracode",
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
  const planPath = join(cwd, ".codexultracode", "runs", runId, "plan.json");

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
    "# CodexUltraCode Run Report",
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
