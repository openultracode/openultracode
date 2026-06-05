import { spawn } from "node:child_process";

import type { Task, WorkerResult } from "../types.js";

export type CliCommandRunner = (
  command: string,
  args: string[],
  options: {
    cwd: string;
    input: string;
    env?: Record<string, string | undefined>;
  }
) => Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

export type CodexCliBackendOptions = {
  model: string;
  cwd: string;
  runner?: CliCommandRunner;
  env?: Record<string, string | undefined>;
};

export class CodexCliBackend {
  private readonly model: string;
  private readonly cwd: string;
  private readonly runner: CliCommandRunner;
  private readonly env?: Record<string, string | undefined>;

  constructor(options: CodexCliBackendOptions) {
    this.model = options.model;
    this.cwd = options.cwd;
    this.runner = options.runner ?? defaultCommandRunner;
    this.env = options.env;
  }

  async run(task: Task): Promise<WorkerResult> {
    const prompt = renderTaskPrompt(task);
    const result = await this.runner(
      "codex",
      [
        "exec",
        "--model",
        this.model,
        "--cd",
        this.cwd,
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--ask-for-approval",
        "never",
        "-"
      ],
      {
        cwd: this.cwd,
        input: prompt,
        env: this.env
      }
    );

    if (result.exitCode !== 0) {
      return failedResult(
        task,
        `codex exited with code ${result.exitCode}: ${formatCommandError(result)}`
      );
    }

    const response = result.stdout.trim();
    const inputTokens = countTokens(prompt);
    const outputTokens = countTokens(response);

    return {
      taskId: task.id,
      status: "succeeded",
      response,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      costUsd: 0
    };
  }
}

export type ClaudeCliBackendOptions = {
  model: string;
  cwd: string;
  runner?: CliCommandRunner;
  env?: Record<string, string | undefined>;
};

export class ClaudeCliBackend {
  private readonly model: string;
  private readonly cwd: string;
  private readonly runner: CliCommandRunner;
  private readonly env?: Record<string, string | undefined>;

  constructor(options: ClaudeCliBackendOptions) {
    this.model = options.model;
    this.cwd = options.cwd;
    this.runner = options.runner ?? defaultCommandRunner;
    this.env = options.env;
  }

  async run(task: Task): Promise<WorkerResult> {
    const prompt = renderTaskPrompt(task);
    const result = await this.runner(
      "claude",
      [
        "-p",
        "--model",
        this.model,
        "--permission-mode",
        "plan",
        "--output-format",
        "text",
        "--no-session-persistence"
      ],
      {
        cwd: this.cwd,
        input: prompt,
        env: this.env
      }
    );

    if (result.exitCode !== 0) {
      return failedResult(
        task,
        `claude exited with code ${result.exitCode}: ${formatCommandError(result)}`
      );
    }

    const response = result.stdout.trim();
    const inputTokens = countTokens(prompt);
    const outputTokens = countTokens(response);

    return {
      taskId: task.id,
      status: "succeeded",
      response,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      costUsd: 0
    };
  }
}

function renderTaskPrompt(task: Task): string {
  return [
    `Task: ${task.title}`,
    `Intent: ${task.intent}`,
    `Importance: ${task.importance}`,
    `Files: ${task.fileScope.join(", ") || "none"}`,
    "",
    task.instructions,
    "",
    "Return the worker response as plain text. Do not edit files directly."
  ].join("\n");
}

function failedResult(task: Task, error: string): WorkerResult {
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

function formatCommandError(result: {
  stdout: string;
  stderr: string;
}): string {
  const output = result.stderr.trim() || result.stdout.trim();
  return output || "no output";
}

function countTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, words.length);
}

async function defaultCommandRunner(
  command: string,
  args: string[],
  options: {
    cwd: string;
    input: string;
    env?: Record<string, string | undefined>;
  }
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env
      },
      stdio: ["pipe", "pipe", "pipe"]
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
    child.stdin.end(options.input);
  });
}
