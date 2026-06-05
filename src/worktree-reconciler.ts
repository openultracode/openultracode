import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Task } from "./types.js";

export type GitCommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type GitRunner = (args: string[]) => Promise<GitCommandResult>;

export type TaskWorkspace = {
  taskId: string;
  status: "created" | "skipped" | "failed";
  worktreePath?: string;
  reason?: string;
};

export type TaskReconciliation = {
  taskId: string;
  status: "changed" | "clean" | "skipped" | "failed" | "conflict";
  changedFiles: string[];
  diffPath?: string;
  worktreePath?: string;
  reason?: string;
};

export async function prepareTaskWorkspace(input: {
  projectRoot: string;
  runDir: string;
  task: Task;
  hasGit: boolean;
  gitRunner?: GitRunner;
}): Promise<TaskWorkspace> {
  if (input.task.intent !== "edit") {
    return {
      taskId: input.task.id,
      status: "skipped",
      reason: "Task is not mutating."
    };
  }

  if (!input.hasGit) {
    return {
      taskId: input.task.id,
      status: "skipped",
      reason: "Repository is not a git checkout."
    };
  }

  const worktreePath = join(input.runDir, "worktrees", safePathPart(input.task.id));
  const result = await (input.gitRunner ?? defaultGitRunner)([
    "-C",
    input.projectRoot,
    "worktree",
    "add",
    "--detach",
    worktreePath,
    "HEAD"
  ]);

  if (result.exitCode !== 0) {
    return {
      taskId: input.task.id,
      status: "failed",
      worktreePath,
      reason: formatGitError(result)
    };
  }

  return {
    taskId: input.task.id,
    status: "created",
    worktreePath
  };
}

export async function captureTaskReconciliation(input: {
  projectRoot?: string;
  task: Task;
  workerDir: string;
  workspace: TaskWorkspace;
  gitRunner?: GitRunner;
}): Promise<TaskReconciliation> {
  await mkdir(input.workerDir, { recursive: true });

  if (input.workspace.status !== "created" || !input.workspace.worktreePath) {
    return writeReconciliation(input.workerDir, {
      taskId: input.task.id,
      status: input.workspace.status === "failed" ? "failed" : "skipped",
      changedFiles: [],
      worktreePath: input.workspace.worktreePath,
      reason: input.workspace.reason
    });
  }

  const runner = input.gitRunner ?? defaultGitRunner;
  const diff = await runner([
    "-C",
    input.workspace.worktreePath,
    "diff",
    "--binary"
  ]);

  if (diff.exitCode !== 0) {
    return writeReconciliation(input.workerDir, {
      taskId: input.task.id,
      status: "failed",
      changedFiles: [],
      worktreePath: input.workspace.worktreePath,
      reason: formatGitError(diff)
    });
  }

  const changedFiles = await runner([
    "-C",
    input.workspace.worktreePath,
    "diff",
    "--name-only"
  ]);

  if (changedFiles.exitCode !== 0) {
    return writeReconciliation(input.workerDir, {
      taskId: input.task.id,
      status: "failed",
      changedFiles: [],
      worktreePath: input.workspace.worktreePath,
      reason: formatGitError(changedFiles)
    });
  }

  const parsedFiles = changedFiles.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const diffPath = join(input.workerDir, "diff.patch");
  const reconciliation: TaskReconciliation = {
    taskId: input.task.id,
    status: parsedFiles.length > 0 ? "changed" : "clean",
    changedFiles: parsedFiles,
    diffPath,
    worktreePath: input.workspace.worktreePath
  };

  await writeFile(diffPath, diff.stdout);
  await writeFile(
    join(input.workerDir, "changed-files.json"),
    `${JSON.stringify(parsedFiles, null, 2)}\n`
  );

  if (input.projectRoot && parsedFiles.length > 0) {
    const applyCheck = await runner([
      "-C",
      input.projectRoot,
      "apply",
      "--check",
      diffPath
    ]);

    if (applyCheck.exitCode !== 0) {
      return writeReconciliation(input.workerDir, {
        ...reconciliation,
        status: "conflict",
        reason: formatGitError(applyCheck)
      });
    }
  }

  return writeReconciliation(input.workerDir, reconciliation);
}

async function writeReconciliation(
  workerDir: string,
  reconciliation: TaskReconciliation
): Promise<TaskReconciliation> {
  await mkdir(workerDir, { recursive: true });
  await writeFile(
    join(workerDir, "reconciliation.json"),
    `${JSON.stringify(reconciliation, null, 2)}\n`
  );
  return reconciliation;
}

function safePathPart(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]/g, "_");
}

function formatGitError(result: GitCommandResult): string {
  return result.stderr.trim() || result.stdout.trim() || "git command failed";
}

async function defaultGitRunner(args: string[]): Promise<GitCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr
      });
    });
  });
}
