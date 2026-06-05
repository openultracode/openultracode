import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  applyCleanPatch,
  captureTaskReconciliation,
  prepareTaskWorkspace
} from "../src/worktree-reconciler.js";
import type { Task } from "../src/types.js";

test("prepareTaskWorkspace creates an isolated git worktree for edit tasks", async () => {
  const runDir = await mkdtemp(join(tmpdir(), "ouc-worktree-"));
  const calls: string[][] = [];
  const expectedPath = join(runDir, "worktrees", "task_1");

  const workspace = await prepareTaskWorkspace({
    projectRoot: "/tmp/project",
    runDir,
    task: makeTask("edit"),
    hasGit: true,
    gitRunner: async (args) => {
      calls.push(args);
      return { exitCode: 0, stdout: "prepared", stderr: "" };
    }
  });

  expect(workspace).toMatchObject({
    taskId: "task_1",
    status: "created",
    worktreePath: expectedPath
  });
  expect(calls).toEqual([
    [
      "-C",
      "/tmp/project",
      "worktree",
      "add",
      "--detach",
      expectedPath,
      "HEAD"
    ]
  ]);
});

test("captureTaskReconciliation preserves worker diff artifacts", async () => {
  const runDir = await mkdtemp(join(tmpdir(), "ouc-reconcile-"));
  const workerDir = join(runDir, "workers", "task_1");
  const worktreePath = join(runDir, "worktrees", "task_1");
  const calls: string[][] = [];

  const reconciliation = await captureTaskReconciliation({
    task: makeTask("edit"),
    workerDir,
    workspace: {
      taskId: "task_1",
      status: "created",
      worktreePath
    },
    gitRunner: async (args) => {
      calls.push(args);
      if (args.includes("--name-only")) {
        return { exitCode: 0, stdout: "src/cli.ts\nREADME.md\n", stderr: "" };
      }
      return {
        exitCode: 0,
        stdout: "diff --git a/src/cli.ts b/src/cli.ts\n",
        stderr: ""
      };
    }
  });

  expect(reconciliation).toMatchObject({
    taskId: "task_1",
    status: "changed",
    worktreePath,
    changedFiles: ["src/cli.ts", "README.md"],
    diffPath: join(workerDir, "diff.patch")
  });
  expect(calls).toEqual([
    ["-C", worktreePath, "diff", "--binary"],
    ["-C", worktreePath, "diff", "--name-only"]
  ]);
  await expect(readFile(join(workerDir, "diff.patch"), "utf8")).resolves.toContain(
    "diff --git"
  );
  await expect(
    JSON.parse(await readFile(join(workerDir, "changed-files.json"), "utf8"))
  ).toEqual(["src/cli.ts", "README.md"]);
  await expect(
    JSON.parse(await readFile(join(workerDir, "reconciliation.json"), "utf8"))
  ).toMatchObject({
    taskId: "task_1",
    status: "changed",
    changedFiles: ["src/cli.ts", "README.md"]
  });
});

test("captureTaskReconciliation reports patches that cannot apply cleanly", async () => {
  const runDir = await mkdtemp(join(tmpdir(), "ouc-reconcile-conflict-"));
  const workerDir = join(runDir, "workers", "task_1");
  const worktreePath = join(runDir, "worktrees", "task_1");
  const calls: string[][] = [];

  const reconciliation = await captureTaskReconciliation({
    projectRoot: "/tmp/project",
    task: makeTask("edit"),
    workerDir,
    workspace: {
      taskId: "task_1",
      status: "created",
      worktreePath
    },
    gitRunner: async (args) => {
      calls.push(args);
      if (args.includes("--name-only")) {
        return { exitCode: 0, stdout: "src/cli.ts\n", stderr: "" };
      }
      if (args.includes("apply")) {
        return { exitCode: 1, stdout: "", stderr: "patch does not apply" };
      }
      return {
        exitCode: 0,
        stdout: "diff --git a/src/cli.ts b/src/cli.ts\n",
        stderr: ""
      };
    }
  });

  expect(reconciliation).toMatchObject({
    taskId: "task_1",
    status: "conflict",
    changedFiles: ["src/cli.ts"],
    reason: "patch does not apply"
  });
  expect(calls).toEqual([
    ["-C", worktreePath, "diff", "--binary"],
    ["-C", worktreePath, "diff", "--name-only"],
    ["-C", "/tmp/project", "apply", "--check", join(workerDir, "diff.patch")]
  ]);
  await expect(
    JSON.parse(await readFile(join(workerDir, "reconciliation.json"), "utf8"))
  ).toMatchObject({
    status: "conflict",
    reason: "patch does not apply"
  });
});

test("applyCleanPatch applies changed reconciliation patches to the project root", async () => {
  const runDir = await mkdtemp(join(tmpdir(), "ouc-apply-patch-"));
  const workerDir = join(runDir, "workers", "task_1");
  const diffPath = join(workerDir, "diff.patch");
  const calls: string[][] = [];
  await mkdir(workerDir, { recursive: true });
  await writeFile(diffPath, "diff --git a/src/cli.ts b/src/cli.ts\n", {
    encoding: "utf8",
    flag: "w"
  });

  const application = await applyCleanPatch({
    projectRoot: "/tmp/project",
    workerDir,
    reconciliation: {
      taskId: "task_1",
      status: "changed",
      changedFiles: ["src/cli.ts"],
      diffPath
    },
    gitRunner: async (args) => {
      calls.push(args);
      return { exitCode: 0, stdout: "", stderr: "" };
    }
  });

  expect(application).toMatchObject({
    taskId: "task_1",
    status: "applied",
    changedFiles: ["src/cli.ts"],
    patchPath: diffPath
  });
  expect(calls).toEqual([
    ["-C", "/tmp/project", "apply", diffPath]
  ]);
  await expect(
    JSON.parse(await readFile(join(workerDir, "patch-application.json"), "utf8"))
  ).toMatchObject({
    taskId: "task_1",
    status: "applied",
    changedFiles: ["src/cli.ts"],
    patchPath: diffPath
  });
});

test("applyCleanPatch refuses reconciliation states that are not safe to apply", async () => {
  const runDir = await mkdtemp(join(tmpdir(), "ouc-apply-refuse-"));
  const workerDir = join(runDir, "workers", "task_1");
  const calls: string[][] = [];

  const application = await applyCleanPatch({
    projectRoot: "/tmp/project",
    workerDir,
    reconciliation: {
      taskId: "task_1",
      status: "conflict",
      changedFiles: ["src/cli.ts"],
      reason: "patch does not apply"
    },
    gitRunner: async (args) => {
      calls.push(args);
      return { exitCode: 0, stdout: "", stderr: "" };
    }
  });

  expect(application).toMatchObject({
    taskId: "task_1",
    status: "skipped",
    changedFiles: ["src/cli.ts"],
    reason: "Reconciliation status conflict is not safe to apply."
  });
  expect(calls).toEqual([]);
  await expect(
    JSON.parse(await readFile(join(workerDir, "patch-application.json"), "utf8"))
  ).toMatchObject({
    taskId: "task_1",
    status: "skipped",
    reason: "Reconciliation status conflict is not safe to apply."
  });
});

function makeTask(intent: Task["intent"]): Task {
  return {
    id: "task_1",
    title: "Implement report command",
    intent,
    importance: "normal",
    modelTier: "strong",
    fileScope: ["src/cli.ts"],
    dependsOn: [],
    instructions: "Goal: implement report command"
  };
}
