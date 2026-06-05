import { mkdtemp, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { runFakeWorkerPool, runWorkerPool } from "../src/worker-pool.js";
import type { Task, WorkerResult } from "../src/types.js";

function makeTasks(): Task[] {
  return [
    {
      id: "task_1",
      title: "Implement report command",
      intent: "edit",
      importance: "normal",
      modelTier: "strong",
      fileScope: ["src/cli.ts"],
      dependsOn: [],
      instructions: "Goal: implement report command"
    },
    {
      id: "task_2",
      title: "Verify report command",
      intent: "test",
      importance: "normal",
      modelTier: "strong",
      fileScope: ["tests/cli.test.ts"],
      dependsOn: ["task_1"],
      instructions: "Goal: verify report command"
    }
  ];
}

test("runFakeWorkerPool executes tasks and writes worker artifacts", async () => {
  const runRoot = await mkdtemp(join(tmpdir(), "ouc-worker-pool-"));
  const workersDir = join(runRoot, "workers");

  const result = await runFakeWorkerPool({
    runId: "run_pool",
    tasks: makeTasks(),
    workersDir
  });

  expect(result.status).toBe("succeeded");
  expect(result.results).toHaveLength(2);
  expect(result.succeeded).toBe(2);
  expect(result.remaining).toBe(0);
  expect(result.taskEvents.map((event) => event.event)).toEqual([
    "task_started",
    "task_finished",
    "task_started",
    "task_finished"
  ]);
  await expect(stat(join(workersDir, "task_1", "result.json"))).resolves.toBeDefined();
  expect(await readFile(join(workersDir, "task_2", "response.md"), "utf8")).toContain(
    "Fake backend fake-model completed task_2."
  );
});

test("runFakeWorkerPool can stop after a task and leave later tasks untouched", async () => {
  const runRoot = await mkdtemp(join(tmpdir(), "ouc-worker-pool-stop-"));
  const workersDir = join(runRoot, "workers");

  const result = await runFakeWorkerPool({
    runId: "run_pool_stopped",
    tasks: makeTasks(),
    workersDir,
    stopAfterTask: 1
  });

  expect(result).toMatchObject({
    status: "stopped",
    stopReason: "Stopped after task 1 by --stop-after-task.",
    succeeded: 1,
    failed: 0,
    remaining: 1
  });
  expect(result.taskEvents.map((event) => event.event)).toEqual([
    "task_started",
    "task_finished"
  ]);
  await expect(stat(join(workersDir, "task_1", "result.json"))).resolves.toBeDefined();
  await expect(stat(join(workersDir, "task_2", "result.json"))).rejects.toMatchObject({
    code: "ENOENT"
  });
});

test("runWorkerPool stops before task execution when the signal is already aborted", async () => {
  const runRoot = await mkdtemp(join(tmpdir(), "ouc-worker-pool-cancel-start-"));
  const workersDir = join(runRoot, "workers");
  const controller = new AbortController();
  controller.abort();
  const runTaskCalls: string[] = [];

  const result = await runWorkerPool({
    runId: "run_pool_canceled_start",
    tasks: makeTasks(),
    workersDir,
    abortSignal: controller.signal,
    runTask: async (task) => {
      runTaskCalls.push(task.id);
      return makeWorkerResult(task);
    }
  });

  expect(result).toMatchObject({
    status: "stopped",
    stopReason: "Run canceled before task execution.",
    succeeded: 0,
    failed: 0,
    remaining: 2
  });
  expect(result.taskEvents).toEqual([]);
  expect(runTaskCalls).toEqual([]);
  await expect(stat(join(workersDir, "task_1", "result.json"))).rejects.toMatchObject({
    code: "ENOENT"
  });
});

test("runWorkerPool stops before the next task when the signal is aborted", async () => {
  const runRoot = await mkdtemp(join(tmpdir(), "ouc-worker-pool-cancel-next-"));
  const workersDir = join(runRoot, "workers");
  const controller = new AbortController();
  const runTaskCalls: string[] = [];

  const result = await runWorkerPool({
    runId: "run_pool_canceled_next",
    tasks: makeTasks(),
    workersDir,
    abortSignal: controller.signal,
    runTask: async (task) => {
      runTaskCalls.push(task.id);
      controller.abort();
      return makeWorkerResult(task);
    }
  });

  expect(result).toMatchObject({
    status: "stopped",
    stopReason: "Run canceled by signal.",
    succeeded: 1,
    failed: 0,
    remaining: 1
  });
  expect(runTaskCalls).toEqual(["task_1"]);
  expect(result.taskEvents.map((event) => event.event)).toEqual([
    "task_started",
    "task_finished"
  ]);
  await expect(stat(join(workersDir, "task_1", "result.json"))).resolves.toBeDefined();
  await expect(stat(join(workersDir, "task_2", "result.json"))).rejects.toMatchObject({
    code: "ENOENT"
  });
});

function makeWorkerResult(task: Task): WorkerResult {
  return {
    taskId: task.id,
    status: "succeeded",
    response: `Completed ${task.id}.`,
    usage: {
      inputTokens: 1,
      outputTokens: 1,
      totalTokens: 2
    },
    costUsd: 0
  };
}
