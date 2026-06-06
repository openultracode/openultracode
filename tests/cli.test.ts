import { runCli } from "../src/cli.js";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const integrationFixtureRoot = (name: string): string =>
  join(process.cwd(), "tests", "fixtures", "integration", name);

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
    "task_reconciled",
    "task_finished",
    "task_started",
    "task_reconciled",
    "task_finished",
    "run_finished"
  ]);
  expect(ledgerLines.filter((line) => line.taskId).map((line) => line.taskId)).toEqual([
    "task_1",
    "task_1",
    "task_1",
    "task_2",
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

test("runCli run captures reconciliation artifacts for edit-task worktrees", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-reconcile-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");
  await execFileAsync("git", ["init"], { cwd: projectRoot });
  await execFileAsync("git", ["config", "user.email", "test@example.com"], {
    cwd: projectRoot
  });
  await execFileAsync("git", ["config", "user.name", "OpenUltraCode Test"], {
    cwd: projectRoot
  });
  await execFileAsync("git", ["add", "."], { cwd: projectRoot });
  await execFileAsync("git", ["commit", "-m", "fixture"], { cwd: projectRoot });

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
      "run_reconcile",
      "--json"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_reconcile");
  const editReconciliation = JSON.parse(
    await readFile(join(runDir, "workers", "task_1", "reconciliation.json"), "utf8")
  ) as {
    status: string;
    changedFiles: string[];
    worktreePath: string;
    diffPath: string;
  };
  const testReconciliation = JSON.parse(
    await readFile(join(runDir, "workers", "task_2", "reconciliation.json"), "utf8")
  ) as {
    status: string;
    changedFiles: string[];
  };
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output.status).toBe("succeeded");
  expect(editReconciliation).toMatchObject({
    status: "clean",
    changedFiles: [],
    worktreePath: join(runDir, "worktrees", "task_1"),
    diffPath: join(runDir, "workers", "task_1", "diff.patch")
  });
  expect(testReconciliation).toMatchObject({
    status: "skipped",
    changedFiles: []
  });
  await expect(stat(editReconciliation.worktreePath)).resolves.toBeDefined();
  await expect(readFile(editReconciliation.diffPath, "utf8")).resolves.toBe("");
  await expect(
    JSON.parse(await readFile(join(runDir, "workers", "task_1", "changed-files.json"), "utf8"))
  ).toEqual([]);
  expect(report).toContain("## Reconciliation");
  expect(report).toContain("- task_1: no changes");
  expect(report).toContain("- task_2: skipped");
});

test("runCli run executes planned tasks with the OpenRouter backend when explicitly selected", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-openrouter-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");
  const requests: Array<{
    url: string;
    init: { method: string; headers: Record<string, string>; body: string };
  }> = [];

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "openrouter",
      "--run-id",
      "run_openrouter",
      "--json"
    ],
    {
      cwd: projectRoot,
      env: { OPENROUTER_API_KEY: "test-openrouter-key" },
      fetchImpl: async (url, init) => {
        requests.push({ url, init });
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            choices: [
              {
                message: {
                  content: `OpenRouter mocked task ${requests.length}.`
                }
              }
            ],
            usage: {
              prompt_tokens: 11,
              completion_tokens: 7,
              total_tokens: 18
            }
          })
        };
      },
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
  const runDir = join(projectRoot, ".ouc", "runs", "run_openrouter");
  const firstBody = JSON.parse(requests[0].init.body) as { model: string };
  const workerResponse = await readFile(
    join(runDir, "workers", "task_1", "response.md"),
    "utf8"
  );
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    runId: "run_openrouter",
    status: "succeeded",
    taskCount: 2,
    succeeded: 2
  });
  expect(requests).toHaveLength(2);
  expect(requests[0].url).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(requests[0].init.headers.Authorization).toBe("Bearer test-openrouter-key");
  expect(firstBody.model).toBe("deepseek/deepseek-v4-flash");
  expect(workerResponse).toContain("OpenRouter mocked task 1.");
  expect(report).toContain("- Status: succeeded");
  expect(report).toContain("OpenRouter backend execution completed locally.");
});

test("runCli run requires OPENROUTER_API_KEY for the OpenRouter backend", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-openrouter-key-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");

  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command",
      "--backend",
      "openrouter",
      "--run-id",
      "run_openrouter_missing_key"
    ],
    {
      cwd: projectRoot,
      env: {},
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );

  expect(exitCode).toBe(1);
  expect(stdout).toEqual([]);
  expect(stderr).toEqual(["OPENROUTER_API_KEY is required"]);
  await expect(
    stat(join(projectRoot, ".ouc", "runs", "run_openrouter_missing_key"))
  ).rejects.toMatchObject({ code: "ENOENT" });
});

test("runCli run stops when actual backend cost exceeds maxCostUsd", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-cost-cap-"));
  await mkdir(join(projectRoot, ".ouc"), { recursive: true });
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");
  await writeFile(
    join(projectRoot, ".ouc", "config.json"),
    `${JSON.stringify({ limits: { maxCostUsd: 0.03 } }, null, 2)}\n`
  );
  const requests: Array<{ init: { body: string } }> = [];
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "openrouter",
      "--run-id",
      "run_cost_cap",
      "--json"
    ],
    {
      cwd: projectRoot,
      env: { OPENROUTER_API_KEY: "test-openrouter-key" },
      fetchImpl: async (_url, init) => {
        requests.push({ init });
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            choices: [{ message: { content: "OpenRouter high-cost task." } }],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 8,
              total_tokens: 18,
              cost: 0.04
            }
          })
        };
      },
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    reason: string;
    succeeded: number;
    remaining: number;
    totalCostUsd: number;
    totalTokens: number;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_cost_cap");
  const ledgerLines = (await readFile(join(runDir, "ledger.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as {
      event: string;
      totalCostUsd?: number;
      totalTokens?: number;
    });
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(1);
  expect(stderr).toEqual([]);
  expect(requests).toHaveLength(1);
  expect(output).toMatchObject({
    status: "stopped",
    reason: "Run stopped after actual cost $0.04 exceeded maxCostUsd $0.03.",
    succeeded: 1,
    remaining: 1,
    totalCostUsd: 0.04,
    totalTokens: 18
  });
  expect(
    ledgerLines.find((line) => line.event === "run_stopped")
  ).toMatchObject({
    totalCostUsd: 0.04,
    totalTokens: 18
  });
  expect(report).toContain("- Total tokens: 18");
  expect(report).toContain("- Total cost: $0.04");
  expect(report).toContain("- Stop reason: Run stopped after actual cost $0.04 exceeded maxCostUsd $0.03.");
});

test("runCli run executes planned tasks with the Codex CLI backend when explicitly selected", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-codex-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");
  const calls: Array<{ command: string; args: string[]; input: string }> = [];
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "codex-cli",
      "--model",
      "gpt-5.3-codex",
      "--run-id",
      "run_codex_cli",
      "--json"
    ],
    {
      cwd: projectRoot,
      commandRunner: async (command, args, options) => {
        calls.push({ command, args, input: options.input });
        return {
          exitCode: 0,
          stdout: `Codex mocked task ${calls.length}.\n`,
          stderr: ""
        };
      },
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
  const runDir = join(projectRoot, ".ouc", "runs", "run_codex_cli");
  const workerResponse = await readFile(
    join(runDir, "workers", "task_1", "response.md"),
    "utf8"
  );
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    runId: "run_codex_cli",
    status: "succeeded",
    taskCount: 2,
    succeeded: 2
  });
  expect(calls).toHaveLength(2);
  expect(calls[0].command).toBe("codex");
  expect(calls[0].args).toContain("read-only");
  expect(calls[0].input).toContain("Task: Implement");
  expect(workerResponse).toContain("Codex mocked task 1.");
  expect(report).toContain("Codex CLI backend execution completed locally.");
});

test("runCli run executes planned tasks with the Claude CLI backend when explicitly selected", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-claude-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");
  const calls: Array<{ command: string; args: string[]; input: string }> = [];
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "claude-cli",
      "--model",
      "opus",
      "--run-id",
      "run_claude_cli",
      "--json"
    ],
    {
      cwd: projectRoot,
      commandRunner: async (command, args, options) => {
        calls.push({ command, args, input: options.input });
        return {
          exitCode: 0,
          stdout: `Claude mocked task ${calls.length}.\n`,
          stderr: ""
        };
      },
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
  const runDir = join(projectRoot, ".ouc", "runs", "run_claude_cli");
  const workerResponse = await readFile(
    join(runDir, "workers", "task_1", "response.md"),
    "utf8"
  );
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    runId: "run_claude_cli",
    status: "succeeded",
    taskCount: 2,
    succeeded: 2
  });
  expect(calls).toHaveLength(2);
  expect(calls[0].command).toBe("claude");
  expect(calls[0].args).toContain("--no-session-persistence");
  expect(calls[0].input).toContain("Task: Implement");
  expect(workerResponse).toContain("Claude mocked task 1.");
  expect(report).toContain("Claude CLI backend execution completed locally.");
});

test("runCli run falls back to another OpenRouter model after a failed attempt", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-openrouter-fallback-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture");
  await writeFile(join(projectRoot, "package.json"), "{}");
  const requests: Array<{ init: { body: string } }> = [];
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "audit this repo",
      "--backend",
      "openrouter",
      "--model",
      "openrouter/primary-fail",
      "--run-id",
      "run_openrouter_fallback",
      "--json"
    ],
    {
      cwd: projectRoot,
      env: { OPENROUTER_API_KEY: "test-openrouter-key" },
      fetchImpl: async (_url, init) => {
        requests.push({ init });
        if (requests.length === 1) {
          return {
            ok: false,
            status: 429,
            text: async () => JSON.stringify({ error: { message: "rate limited" } })
          };
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            choices: [{ message: { content: "Fallback model completed task." } }],
            usage: {
              prompt_tokens: 5,
              completion_tokens: 4,
              total_tokens: 9
            }
          })
        };
      },
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    succeeded: number;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_openrouter_fallback");
  const requestModels = requests.map((request) => (
    JSON.parse(request.init.body) as { model: string }
  ).model);
  const result = JSON.parse(
    await readFile(join(runDir, "workers", "task_1", "result.json"), "utf8")
  ) as {
    status: string;
    attempts: Array<{ model: string; status: string; error?: string }>;
  };
  const ledgerLines = (await readFile(join(runDir, "ledger.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; attemptCount?: number });

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({ status: "succeeded", succeeded: 1 });
  expect(requestModels).toEqual([
    "openrouter/primary-fail",
    "qwen/qwen3-coder:free"
  ]);
  expect(result.status).toBe("succeeded");
  expect(result.attempts).toMatchObject([
    {
      model: "openrouter/primary-fail",
      status: "failed",
      error: "OpenRouter request failed with status 429: rate limited"
    },
    {
      model: "qwen/qwen3-coder:free",
      status: "succeeded"
    }
  ]);
  expect(
    ledgerLines.find((line) => line.event === "task_finished")
  ).toMatchObject({ attemptCount: 2 });
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

test("runCli run blocks overlapping edit file ownership before worker execution", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-ownership-"));
  await writeFile(join(projectRoot, "README.md"), "# Fixture\n");
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command, add tests, and update README docs",
      "--backend",
      "fake",
      "--run-id",
      "run_ownership_conflict",
      "--json"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    reason: string;
    ledgerPath: string;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_ownership_conflict");
  const plan = JSON.parse(await readFile(join(runDir, "plan.json"), "utf8")) as {
    fileOwnership: {
      hasConflicts: boolean;
      conflicts: Array<{ path: string; ownerTaskIds: string[] }>;
    };
  };
  const ledgerLines = (await readFile(output.ledgerPath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; limit?: string; reason?: string });
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(1);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    status: "blocked",
    reason: "File ownership conflict: README.md is claimed by task_1, task_3."
  });
  expect(plan.fileOwnership).toMatchObject({
    hasConflicts: true,
    conflicts: [
      {
        path: "README.md",
        ownerTaskIds: ["task_1", "task_3"]
      }
    ]
  });
  expect(ledgerLines).toMatchObject([
    { event: "plan_created" },
    {
      event: "run_blocked",
      limit: "fileOwnership",
      reason: output.reason
    }
  ]);
  expect(report).toContain("- Status: blocked");
  expect(report).toContain(output.reason);
  await expect(stat(join(runDir, "workers", "task_1", "result.json"))).rejects.toMatchObject({
    code: "ENOENT"
  });
});

test("runCli run blocks plans that exceed maxTasks before worker execution", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-max-tasks-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await mkdir(join(projectRoot, ".ouc"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");
  await writeFile(
    join(projectRoot, ".ouc", "config.json"),
    JSON.stringify({ limits: { maxTasks: 1 } })
  );

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
      "run_limited_tasks",
      "--json"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    reason: string;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_limited_tasks");
  const ledgerLines = (await readFile(join(runDir, "ledger.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; reason?: string });
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(1);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    status: "blocked",
    reason: "Planned task count 2 exceeds limits.maxTasks 1."
  });
  expect(ledgerLines.map((line) => line.event)).toEqual([
    "plan_created",
    "run_blocked"
  ]);
  expect(ledgerLines[1].reason).toBe(output.reason);
  expect(report).toContain("- Status: blocked");
  expect(report).toContain(output.reason);
});

test("runCli run blocks plans that exceed maxCostUsd before worker execution", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-max-cost-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "tests"), { recursive: true });
  await mkdir(join(projectRoot, ".ouc"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  await writeFile(join(projectRoot, "tests", "cli.test.ts"), "test('ok', () => {});");
  await writeFile(
    join(projectRoot, ".ouc", "config.json"),
    JSON.stringify({ limits: { maxCostUsd: 0 } })
  );

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
      "run_limited_cost",
      "--json"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    reason: string;
    ledgerPath: string;
  };
  const ledgerLines = (await readFile(output.ledgerPath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; reason?: string });

  expect(exitCode).toBe(1);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    status: "blocked",
    reason: "Estimated cost $0.02 exceeds limits.maxCostUsd $0.00."
  });
  expect(ledgerLines.map((line) => line.event)).toEqual([
    "plan_created",
    "run_blocked"
  ]);
});

test("runCli run can stop after a fake task and report partial execution", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-stopped-"));
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
      "run_stopped",
      "--stop-after-task",
      "1",
      "--json"
    ],
    {
      cwd: projectRoot,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    reason: string;
    succeeded: number;
    remaining: number;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_stopped");
  const ledgerLines = (await readFile(join(runDir, "ledger.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; taskId?: string });
  const report = await readFile(output.finalReportPath, "utf8");
  const firstWorkerResponse = await readFile(
    join(runDir, "workers", "task_1", "response.md"),
    "utf8"
  );

  expect(exitCode).toBe(1);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    status: "stopped",
    reason: "Stopped after task 1 by --stop-after-task.",
    succeeded: 1,
    remaining: 1
  });
  expect(ledgerLines.map((line) => line.event)).toEqual([
    "plan_created",
    "task_started",
    "task_reconciled",
    "task_finished",
    "run_stopped"
  ]);
  expect(ledgerLines.filter((line) => line.taskId).map((line) => line.taskId)).toEqual([
    "task_1",
    "task_1",
    "task_1"
  ]);
  expect(firstWorkerResponse).toContain("Fake backend fake-model completed task_1.");
  await expect(stat(join(runDir, "workers", "task_2", "response.md"))).rejects.toMatchObject({
    code: "ENOENT"
  });
  expect(report).toContain("- Status: stopped");
  expect(report).toContain("- Succeeded tasks: 1");
  expect(report).toContain("- Remaining tasks: 1");
  expect(report).toContain("- Stop reason: Stopped after task 1 by --stop-after-task.");
  expect(report).toContain("task_2");
  expect(report).toContain("not run");
});

test("runCli run preserves stopped artifacts when the runtime is already aborted", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-cli-run-aborted-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "src", "cli.ts"), "export {};");
  const controller = new AbortController();
  controller.abort();
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
      "run_aborted",
      "--json"
    ],
    {
      cwd: projectRoot,
      abortSignal: controller.signal,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    reason: string;
    remaining: number;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_aborted");
  const ledgerLines = (await readFile(join(runDir, "ledger.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; reason?: string });
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(1);
  expect(stderr).toEqual([]);
  expect(output).toMatchObject({
    status: "stopped",
    reason: "Run canceled before task execution.",
    remaining: 2
  });
  expect(ledgerLines).toMatchObject([
    { event: "plan_created" },
    { event: "run_stopped", reason: "Run canceled before task execution." }
  ]);
  expect(report).toContain("- Status: stopped");
  expect(report).toContain("- Stop reason: Run canceled before task execution.");
  await expect(stat(join(runDir, "workers", "task_1", "result.json"))).rejects.toMatchObject({
    code: "ENOENT"
  });
});

test("runCli run does not apply clean worker patches without opt-in", async () => {
  const projectRoot = await createGitPatchFixture("ouc-cli-run-no-apply-");
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "codex-cli",
      "--run-id",
      "run_no_apply",
      "--json"
    ],
    {
      cwd: projectRoot,
      commandRunner: mutateFirstTaskWorker,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    ledgerPath: string;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_no_apply");
  const ledgerLines = (await readFile(output.ledgerPath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string });
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output.status).toBe("succeeded");
  expect(await readFile(join(projectRoot, "src", "cli.ts"), "utf8")).toBe(
    "export {};\n"
  );
  expect(
    await readFile(join(runDir, "workers", "task_1", "diff.patch"), "utf8")
  ).toContain("applied = true");
  expect(ledgerLines.map((line) => line.event)).not.toContain(
    "task_patch_application"
  );
  expect(report).not.toContain("## Patch Application");
});

test("runCli run applies clean worker patches when the CLI flag opts in", async () => {
  const projectRoot = await createGitPatchFixture("ouc-cli-run-apply-flag-");
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "codex-cli",
      "--run-id",
      "run_apply_flag",
      "--apply-clean-patches",
      "--json"
    ],
    {
      cwd: projectRoot,
      commandRunner: mutateFirstTaskWorker,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as {
    status: string;
    ledgerPath: string;
    finalReportPath: string;
  };
  const runDir = join(projectRoot, ".ouc", "runs", "run_apply_flag");
  const ledgerLines = (await readFile(output.ledgerPath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as {
      event: string;
      taskId?: string;
      status?: string;
      changedFiles?: string[];
    });
  const application = JSON.parse(
    await readFile(join(runDir, "workers", "task_1", "patch-application.json"), "utf8")
  ) as {
    status: string;
    changedFiles: string[];
  };
  const report = await readFile(output.finalReportPath, "utf8");

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output.status).toBe("succeeded");
  expect(await readFile(join(projectRoot, "src", "cli.ts"), "utf8")).toBe(
    "export const applied = true;\n"
  );
  expect(application).toMatchObject({
    status: "applied",
    changedFiles: ["src/cli.ts"]
  });
  expect(
    ledgerLines.find((line) => (
      line.event === "task_patch_application" && line.taskId === "task_1"
    ))
  ).toMatchObject({
    status: "applied",
    changedFiles: ["src/cli.ts"]
  });
  expect(report).toContain("## Patch Application");
  expect(report).toContain("- task_1: applied src/cli.ts");
});

test("runCli run applies clean worker patches when project config opts in", async () => {
  const projectRoot = await createGitPatchFixture("ouc-cli-run-apply-config-");
  await mkdir(join(projectRoot, ".ouc"), { recursive: true });
  await writeFile(
    join(projectRoot, ".ouc", "config.json"),
    JSON.stringify({ patchApplication: { applyCleanPatches: true } }, null, 2)
  );
  const stdout: string[] = [];
  const stderr: string[] = [];

  const exitCode = await runCli(
    [
      "node",
      "ouc",
      "run",
      "implement report command and test it",
      "--backend",
      "codex-cli",
      "--run-id",
      "run_apply_config",
      "--json"
    ],
    {
      cwd: projectRoot,
      commandRunner: mutateFirstTaskWorker,
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    }
  );
  const output = JSON.parse(stdout.join("\n")) as { status: string };

  expect(exitCode).toBe(0);
  expect(stderr).toEqual([]);
  expect(output.status).toBe("succeeded");
  expect(await readFile(join(projectRoot, "src", "cli.ts"), "utf8")).toBe(
    "export const applied = true;\n"
  );
});

async function createGitPatchFixture(prefix: string): Promise<string> {
  const projectRoot = await mkdtemp(join(tmpdir(), prefix));
  await cp(integrationFixtureRoot("git-patch-app"), projectRoot, {
    recursive: true
  });
  await execFileAsync("git", ["init"], { cwd: projectRoot });
  await execFileAsync("git", ["config", "user.email", "ouc@example.test"], {
    cwd: projectRoot
  });
  await execFileAsync("git", ["config", "user.name", "OUC Test"], {
    cwd: projectRoot
  });
  await execFileAsync("git", ["add", "."], { cwd: projectRoot });
  await execFileAsync("git", ["commit", "-m", "fixture"], { cwd: projectRoot });
  return projectRoot;
}

async function mutateFirstTaskWorker(
  _command: string,
  _args: string[],
  options: { cwd: string; input: string }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  if (options.input.includes("Task: Implement")) {
    await writeFile(join(options.cwd, "src", "cli.ts"), "export const applied = true;\n");
  }

  return {
    exitCode: 0,
    stdout: "mocked worker completed task",
    stderr: ""
  };
}
