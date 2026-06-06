import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("fake-run artifact examples are package-linked and parseable", async () => {
  const examplesRoot = resolve(process.cwd(), "examples", "fake-run-artifacts");
  const runRoot = resolve(examplesRoot, "run_fake_docs");
  const docs = [
    await readFile(resolve(process.cwd(), "README.md"), "utf8"),
    await readFile(resolve(process.cwd(), "CONTRIBUTING.md"), "utf8"),
    await readFile(resolve(process.cwd(), "docs", "ARTIFACTS.md"), "utf8"),
    await readFile(resolve(process.cwd(), "examples", "README.md"), "utf8")
  ];

  for (const doc of docs) {
    expect(doc).toContain("examples/fake-run-artifacts");
  }

  await expect(access(resolve(examplesRoot, "README.md"))).resolves.toBeUndefined();
  await expect(access(resolve(runRoot, "final-report.md"))).resolves.toBeUndefined();
  await expect(
    access(resolve(runRoot, "workers", "task_1", "response.md"))
  ).resolves.toBeUndefined();

  const plan = JSON.parse(await readFile(resolve(runRoot, "plan.json"), "utf8")) as {
    runId: string;
    tasks: Array<{ id: string }>;
    routes: Record<string, { primary: { backend: string } }>;
  };
  expect(plan.runId).toBe("run_fake_docs");
  expect(plan.tasks.map((task) => task.id)).toEqual(["task_1"]);
  expect(plan.routes.task_1.primary.backend).toBe("fake");

  const ledgerEvents = (await readFile(resolve(runRoot, "ledger.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { event: string; runId: string; taskId?: string });
  expect(ledgerEvents.map((event) => event.event)).toEqual([
    "plan_created",
    "task_started",
    "task_reconciled",
    "task_finished",
    "run_finished"
  ]);
  expect(ledgerEvents.every((event) => event.runId === "run_fake_docs")).toBe(true);

  const result = JSON.parse(
    await readFile(resolve(runRoot, "workers", "task_1", "result.json"), "utf8")
  ) as {
    taskId: string;
    status: string;
    response: string;
    usage: { totalTokens: number };
    costUsd: number;
  };
  expect(result).toMatchObject({
    taskId: "task_1",
    status: "succeeded",
    costUsd: 0
  });
  expect(result.response).toContain("Fake backend fake-model completed task_1.");
  expect(result.usage.totalTokens).toBeGreaterThan(0);

  const changedFiles = JSON.parse(
    await readFile(resolve(runRoot, "workers", "task_1", "changed-files.json"), "utf8")
  ) as string[];
  expect(changedFiles).toEqual([]);

  const reconciliation = JSON.parse(
    await readFile(resolve(runRoot, "workers", "task_1", "reconciliation.json"), "utf8")
  ) as { status: string; changedFiles: string[] };
  expect(reconciliation).toMatchObject({
    status: "clean",
    changedFiles: []
  });
});
