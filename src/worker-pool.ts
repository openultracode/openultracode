import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { FakeBackend } from "./backends/fake.js";
import type { Task, WorkerResult } from "./types.js";
import type { TaskReconciliation, TaskWorkspace } from "./worktree-reconciler.js";

export type WorkerPoolStatus = "succeeded" | "stopped";

export type WorkerPoolEvent = Record<string, unknown> & {
  event: "task_started" | "task_finished" | "task_reconciled";
};

export type WorkerPoolResult = {
  status: WorkerPoolStatus;
  results: WorkerResult[];
  reconciliations: TaskReconciliation[];
  taskEvents: WorkerPoolEvent[];
  succeeded: number;
  failed: number;
  remaining: number;
  totalCostUsd: number;
  stopReason?: string;
};

export type RunFakeWorkerPoolInput = {
  runId: string;
  tasks: Task[];
  workersDir: string;
  stopAfterTask?: number;
  abortSignal?: AbortSignal;
};

export type RunWorkerPoolInput = RunFakeWorkerPoolInput & {
  runTask: (
    task: Task,
    context: { worktreePath?: string; abortSignal?: AbortSignal }
  ) => Promise<WorkerResult>;
  prepareTask?: (task: Task) => Promise<TaskWorkspace>;
  finalizeTask?: (
    task: Task,
    result: WorkerResult,
    workspace: TaskWorkspace
  ) => Promise<TaskReconciliation>;
};

export async function runWorkerPool(input: RunWorkerPoolInput): Promise<WorkerPoolResult> {
  const results: WorkerResult[] = [];
  const reconciliations: TaskReconciliation[] = [];
  const taskEvents: WorkerPoolEvent[] = [];

  if (input.abortSignal?.aborted && input.tasks.length > 0) {
    return summarizeWorkerPool({
      status: "stopped",
      tasks: input.tasks,
      results,
      reconciliations,
      taskEvents,
      stopReason: "Run canceled before task execution."
    });
  }

  if (input.stopAfterTask === 0 && input.tasks.length > 0) {
    return summarizeWorkerPool({
      status: "stopped",
      tasks: input.tasks,
      results,
      reconciliations,
      taskEvents,
      stopReason: stopAfterTaskReason(0)
    });
  }

  for (const task of input.tasks) {
    if (input.abortSignal?.aborted) {
      return summarizeWorkerPool({
        status: "stopped",
        tasks: input.tasks,
        results,
        reconciliations,
        taskEvents,
        stopReason: results.length === 0
          ? "Run canceled before task execution."
          : "Run canceled by signal."
      });
    }

    const workspace = input.prepareTask
      ? await input.prepareTask(task)
      : skippedWorkspace(task, "Workspace preparation is not configured.");

    taskEvents.push({
      event: "task_started",
      runId: input.runId,
      taskId: task.id,
      modelTier: task.modelTier,
      worktreePath: workspace.worktreePath,
      startedAt: new Date().toISOString()
    });

    const result = workspace.status === "failed"
      ? failedWorkspaceResult(task, workspace.reason ?? "Workspace preparation failed.")
      : await input.runTask(task, {
        worktreePath: workspace.worktreePath,
        abortSignal: input.abortSignal
      });
    results.push(result);
    await writeWorkerArtifacts(input.workersDir, task, result);

    const reconciliation = input.finalizeTask
      ? await input.finalizeTask(task, result, workspace)
      : undefined;

    if (reconciliation) {
      reconciliations.push(reconciliation);
      taskEvents.push({
        event: "task_reconciled",
        runId: input.runId,
        taskId: task.id,
        status: reconciliation.status,
        changedFiles: reconciliation.changedFiles,
        diffPath: reconciliation.diffPath,
        reconciledAt: new Date().toISOString()
      });
    }

    taskEvents.push({
      event: "task_finished",
      runId: input.runId,
      taskId: task.id,
      status: result.status,
      attemptCount: result.attempts?.length ?? 1,
      totalTokens: result.usage.totalTokens,
      costUsd: result.costUsd,
      finishedAt: new Date().toISOString()
    });

    if (
      input.stopAfterTask !== undefined &&
      results.length >= input.stopAfterTask &&
      results.length < input.tasks.length
    ) {
      return summarizeWorkerPool({
        status: "stopped",
        tasks: input.tasks,
        results,
        reconciliations,
        taskEvents,
        stopReason: stopAfterTaskReason(results.length)
      });
    }
  }

  return summarizeWorkerPool({
    status: "succeeded",
    tasks: input.tasks,
    results,
    reconciliations,
    taskEvents
  });
}

export async function runFakeWorkerPool(
  input: RunFakeWorkerPoolInput
): Promise<WorkerPoolResult> {
  const backend = new FakeBackend({ backend: "fake", model: "fake-model" });

  return runWorkerPool({
    ...input,
    runTask: (task) => backend.run(task)
  });
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

function summarizeWorkerPool(input: {
  status: WorkerPoolStatus;
  tasks: Task[];
  results: WorkerResult[];
  reconciliations: TaskReconciliation[];
  taskEvents: WorkerPoolEvent[];
  stopReason?: string;
}): WorkerPoolResult {
  const succeeded = input.results.filter((result) => (
    result.status === "succeeded"
  )).length;
  const failed = input.results.length - succeeded;

  return {
    status: input.status,
    results: input.results,
    reconciliations: input.reconciliations,
    taskEvents: input.taskEvents,
    succeeded,
    failed,
    remaining: input.tasks.length - input.results.length,
    totalCostUsd: sumCosts(input.results),
    stopReason: input.stopReason
  };
}

function skippedWorkspace(task: Task, reason: string): TaskWorkspace {
  return {
    taskId: task.id,
    status: "skipped",
    reason
  };
}

function failedWorkspaceResult(task: Task, error: string): WorkerResult {
  return {
    taskId: task.id,
    status: "failed",
    response: "",
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    },
    costUsd: 0,
    error
  };
}

function stopAfterTaskReason(taskCount: number): string {
  if (taskCount === 0) {
    return "Stopped before task execution by --stop-after-task.";
  }

  return `Stopped after task ${taskCount} by --stop-after-task.`;
}

function sumCosts(results: WorkerResult[]): number {
  return Number(
    results.reduce((sum, result) => sum + result.costUsd, 0).toFixed(6)
  );
}
