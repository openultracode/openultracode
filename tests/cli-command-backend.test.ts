import { ClaudeCliBackend, CodexCliBackend } from "../src/backends/cli-command.js";
import type { Task } from "../src/types.js";

test("CodexCliBackend runs codex exec in read-only mode and maps stdout", async () => {
  const calls: Array<{
    command: string;
    args: string[];
    input: string;
    cwd: string;
  }> = [];
  const backend = new CodexCliBackend({
    model: "gpt-5.3-codex",
    cwd: "/tmp/project",
    runner: async (command, args, options) => {
      calls.push({
        command,
        args,
        input: options.input,
        cwd: options.cwd
      });
      return {
        exitCode: 0,
        stdout: "Codex CLI completed the task.\n",
        stderr: ""
      };
    }
  });

  const result = await backend.run(makeTask());

  expect(result).toMatchObject({
    taskId: "task_1",
    status: "succeeded",
    response: "Codex CLI completed the task.",
    costUsd: 0
  });
  expect(result.usage.totalTokens).toBeGreaterThan(0);
  expect(calls).toHaveLength(1);
  expect(calls[0].command).toBe("codex");
  expect(calls[0].cwd).toBe("/tmp/project");
  expect(calls[0].args).toEqual([
    "exec",
    "--model",
    "gpt-5.3-codex",
    "--cd",
    "/tmp/project",
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "--ask-for-approval",
    "never",
    "-"
  ]);
  expect(calls[0].input).toContain("Task: Implement report command");
  expect(calls[0].input).toContain("Files: src/cli.ts");
});

test("CodexCliBackend returns a failed worker result when codex exits nonzero", async () => {
  const backend = new CodexCliBackend({
    model: "gpt-5.3-codex",
    cwd: "/tmp/project",
    runner: async () => ({
      exitCode: 2,
      stdout: "",
      stderr: "auth required"
    })
  });

  const result = await backend.run(makeTask());

  expect(result).toMatchObject({
    taskId: "task_1",
    status: "failed",
    response: "",
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    },
    costUsd: 0,
    error: "codex exited with code 2: auth required"
  });
});

test("ClaudeCliBackend runs claude print mode with plan permissions", async () => {
  const calls: Array<{
    command: string;
    args: string[];
    input: string;
    cwd: string;
  }> = [];
  const backend = new ClaudeCliBackend({
    model: "opus",
    cwd: "/tmp/project",
    runner: async (command, args, options) => {
      calls.push({
        command,
        args,
        input: options.input,
        cwd: options.cwd
      });
      return {
        exitCode: 0,
        stdout: "Claude CLI completed the task.\n",
        stderr: ""
      };
    }
  });

  const result = await backend.run(makeTask());

  expect(result).toMatchObject({
    taskId: "task_1",
    status: "succeeded",
    response: "Claude CLI completed the task.",
    costUsd: 0
  });
  expect(calls).toHaveLength(1);
  expect(calls[0].command).toBe("claude");
  expect(calls[0].cwd).toBe("/tmp/project");
  expect(calls[0].args).toEqual([
    "-p",
    "--model",
    "opus",
    "--permission-mode",
    "plan",
    "--output-format",
    "text",
    "--no-session-persistence"
  ]);
  expect(calls[0].input).toContain("Task: Implement report command");
});

function makeTask(): Task {
  return {
    id: "task_1",
    title: "Implement report command",
    intent: "edit",
    importance: "normal",
    modelTier: "strong",
    fileScope: ["src/cli.ts"],
    dependsOn: [],
    instructions: "Goal: implement report command"
  };
}
