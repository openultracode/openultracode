import { runCli } from "../src/cli.js";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("runCli prints help with primary commands", async () => {
  const lines: string[] = [];

  const exitCode = await runCli(["node", "ouc", "--help"], {
    cwd: process.cwd(),
    stdout: (line) => lines.push(line),
    stderr: (line) => lines.push(line)
  });

  expect(exitCode).toBe(0);
  expect(lines.join("\n")).toContain("ouc plan");
  expect(lines.join("\n")).toContain("ouc run");
  expect(lines.join("\n")).toContain("ouc status");
  expect(lines.join("\n")).toContain("ouc report");
});

test("runCli plan writes a deterministic dry-run plan artifact", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-plan-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    ["node", "ouc", "plan", "audit this repo for TODOs", "--run-id", "run_cli"],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );

  const planPath = join(projectRoot, ".ouc", "runs", "run_cli", "plan.json");
  const ledgerPath = join(
    projectRoot,
    ".ouc",
    "runs",
    "run_cli",
    "ledger.jsonl"
  );
  const plan = JSON.parse(await readFile(planPath, "utf8")) as {
    runId: string;
    goal: string;
    tasks: Array<{ id: string; modelTier: string }>;
  };
  const ledgerLines = (await readFile(ledgerPath, "utf8")).trim().split("\n");
  const ledgerEntry = JSON.parse(ledgerLines[0]) as {
    event: string;
    runId: string;
    taskCount: number;
  };

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(stdout.join("\n")).toContain("run_cli");
  expect(stdout.join("\n")).toContain(planPath);
  expect(plan.runId).toBe("run_cli");
  expect(plan.goal).toBe("audit this repo for TODOs");
  expect(plan.tasks[0]).toMatchObject({ id: "task_1", modelTier: "free" });
  expect(ledgerEntry).toMatchObject({
    event: "plan_created",
    runId: "run_cli",
    taskCount: 1
  });
});

test("runCli plan can print machine-readable JSON output", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-plan-json-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "plan",
      "implement report command and test it",
      "--run-id",
      "run_plan_json",
      "--json"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    runId: string;
    goal: string;
    taskCount: number;
    estimatedCostUsd: number;
    planPath: string;
  };

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    runId: "run_plan_json",
    goal: "implement report command and test it",
    taskCount: 2,
    estimatedCostUsd: 0.02
  });
  await expect(readFile(output.planPath, "utf8")).resolves.toContain(
    "run_plan_json"
  );
});

test("runCli plan rejects a missing run id value", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-plan-bad-id-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    ["node", "ouc", "plan", "audit this repo", "--run-id"],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );

  expect(exitCode).toBe(1);
  expect(stdout).toEqual([]);
  expect(stderr.join("\n")).toContain("--run-id requires a value");
});

test("runCli status summarizes an existing local run artifact", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-status-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");

  await runCli(
    ["node", "ouc", "plan", "audit this repo for TODOs", "--run-id", "run_status"],
    {
      cwd: projectRoot,
      stdout: () => undefined,
      stderr: () => undefined
    }
  );
  await runCli(["node", "ouc", "report", "run_status"], {
    cwd: projectRoot,
    stdout: () => undefined,
    stderr: () => undefined
  });

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(["node", "ouc", "status", "run_status"], {
    cwd: projectRoot,
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line)
  });

  const output = stdout.join("\n");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toContain("Run: run_status");
  expect(output).toContain("Goal: audit this repo for TODOs");
  expect(output).toContain("Tasks: 1 planned");
  expect(output).toContain("Estimated cost: $0.00");
  expect(output).toContain("Ledger: present");
  expect(output).toContain("Final report: present");
});

test("runCli status can print machine-readable JSON", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-status-json-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");

  await runCli(
    ["node", "ouc", "plan", "audit this repo for TODOs", "--run-id", "run_status_json"],
    {
      cwd: projectRoot,
      stdout: () => undefined,
      stderr: () => undefined
    }
  );

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    ["node", "ouc", "status", "run_status_json", "--json"],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const status = JSON.parse(stdout.join("\n")) as {
    runId: string;
    goal: string;
    taskCount: number;
    estimatedCostUsd: number;
    ledgerPresent: boolean;
    finalReportPresent: boolean;
  };

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(status).toMatchObject({
    runId: "run_status_json",
    goal: "audit this repo for TODOs",
    taskCount: 1,
    estimatedCostUsd: 0,
    ledgerPresent: true,
    finalReportPresent: false
  });
});

test("runCli report prints a markdown summary for a planned run", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-report-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");

  await runCli(
    ["node", "ouc", "plan", "audit this repo for TODOs", "--run-id", "run_report"],
    {
      cwd: projectRoot,
      stdout: () => undefined,
      stderr: () => undefined
    }
  );

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(["node", "ouc", "report", "run_report"], {
    cwd: projectRoot,
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line)
  });

  const output = stdout.join("\n");
  const reportPath = join(
    projectRoot,
    ".ouc",
    "runs",
    "run_report",
    "final-report.md"
  );
  const savedReport = await readFile(reportPath, "utf8");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toContain("# OpenUltraCode Run Report");
  expect(output).toContain("- Run: `run_report`");
  expect(output).toContain("- Goal: audit this repo for TODOs");
  expect(output).toContain("- Planned tasks: 1");
  expect(output).toContain("task_1");
  expect(output).toContain("No worker execution has run yet.");
  expect(savedReport).toBe(`${output}\n`);
});

test("runCli report preserves an existing final report artifact", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-report-existing-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");

  await runCli(
    ["node", "ouc", "plan", "audit this repo for TODOs", "--run-id", "run_existing_report"],
    {
      cwd: projectRoot,
      stdout: () => undefined,
      stderr: () => undefined
    }
  );

  const runDir = join(
    projectRoot,
    ".ouc",
    "runs",
    "run_existing_report"
  );
  const reportPath = join(runDir, "final-report.md");
  const existingReport = "# Existing Report\n\nWorker-authored result.\n";
  await mkdir(runDir, { recursive: true });
  await writeFile(reportPath, existingReport);

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(["node", "ouc", "report", "run_existing_report"], {
    cwd: projectRoot,
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line)
  });

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(stdout.join("\n")).toBe(existingReport.trimEnd());
  expect(await readFile(reportPath, "utf8")).toBe(existingReport);
});

test("runCli run executes planned tasks with the fake backend and writes run artifacts", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-fake-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "fake",
      "--run-id",
      "run_fake",
      "--json"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    runId: string;
    status: string;
    taskCount: number;
    succeeded: number;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_fake");
  const ledgerLines = (await readFile(join(runDir, "ledger.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; taskId?: string });
  const report = await readFile(join(runDir, "final-report.md"), "utf8");
  const workerResponse = await readFile(
    join(runDir, "workers", "task_1", "response.md"),
    "utf8"
  );

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    runId: "run_fake",
    status: "succeeded",
    taskCount: 2,
    succeeded: 2
  });
  await expect(stat(output.finalReportPath)).resolves.toBeDefined();
  expect(ledgerLines.map((line) => line.event)).toEqual([
    "plan_created",
    "task_started",
    "task_finished",
    "task_started",
    "task_finished",
    "run_finished"
  ]);
  expect(ledgerLines.filter((line) => line.taskId).map((line) => line.taskId)).toEqual([
    "task_1",
    "task_1",
    "task_2",
    "task_2"
  ]);
  expect(workerResponse).toContain("Fake backend fake-model completed task_1.");
  expect(report).toContain("# OpenUltraCode Run Report");
  expect(report).toContain("- Status: succeeded");
  expect(report).toContain("- Succeeded tasks: 2");
  expect(report).toContain("task_1");
  expect(report).toContain("task_2");
});

test("runCli run refuses to overwrite an existing final report", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-existing-"));
  const runDir = join(projectRoot, ".ouc", "runs", "run_existing");
  await mkdir(runDir, { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(runDir, "final-report.md"), "# Existing Report\n");

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command",
      "--backend",
      "fake",
      "--run-id",
      "run_existing"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );

  expect(exitCode).toBe(1);
  expect(stdout).toEqual([]);
  expect(stderr).toEqual(['Run "run_existing" already has a final report.']);
  expect(await readFile(join(runDir, "final-report.md"), "utf8")).toBe(
    "# Existing Report\n"
  );
});
