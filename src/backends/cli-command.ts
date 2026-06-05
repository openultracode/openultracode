import { spawn } from "node:child_process";

import type { Task, WorkerResult } from "../types.js";

export type CliCommandRunner = (
  command: string,
  args: string[],
  options: {
    cwd: string;
    input: string;
    env?: Record<string, string | undefined>;
    abortSignal?: AbortSignal;
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

  async run(task: Task, abortSignal?: AbortSignal): Promise<WorkerResult> {
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
        "--json",
        "-"
      ],
      {
        cwd: this.cwd,
        input: prompt,
        env: this.env,
        abortSignal
      }
    );

    if (result.exitCode !== 0) {
      return failedResult(
        task,
        `codex exited with code ${result.exitCode}: ${formatCommandError(result)}`
      );
    }

    const output = parseStructuredCliOutput(result.stdout, result.stderr);
    const response = output.response ?? result.stdout.trim();
    const usage = output.usage ?? fallbackUsage(prompt, response);

    return {
      taskId: task.id,
      status: "succeeded",
      response,
      usage,
      costUsd: output.costUsd ?? 0
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

  async run(task: Task, abortSignal?: AbortSignal): Promise<WorkerResult> {
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
        "json",
        "--no-session-persistence"
      ],
      {
        cwd: this.cwd,
        input: prompt,
        env: this.env,
        abortSignal
      }
    );

    if (result.exitCode !== 0) {
      return failedResult(
        task,
        `claude exited with code ${result.exitCode}: ${formatCommandError(result)}`
      );
    }

    const output = parseStructuredCliOutput(result.stdout, result.stderr);
    const response = output.response ?? result.stdout.trim();
    const usage = output.usage ?? fallbackUsage(prompt, response);

    return {
      taskId: task.id,
      status: "succeeded",
      response,
      usage,
      costUsd: output.costUsd ?? 0
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

function fallbackUsage(prompt: string, response: string): WorkerResult["usage"] {
  const inputTokens = countTokens(prompt);
  const outputTokens = countTokens(response);

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens
  };
}

function parseStructuredCliOutput(
  stdout: string,
  stderr: string
): {
  response?: string;
  usage?: WorkerResult["usage"];
  costUsd?: number;
} {
  const records = [
    ...parseJsonRecords(stdout),
    ...parseJsonRecords(stderr)
  ];
  let response: string | undefined;
  let usage: WorkerResult["usage"] | undefined;
  let costUsd: number | undefined;

  for (const record of records) {
    response = readResponse(record) ?? response;
    usage = readUsage(record) ?? usage;
    costUsd = readCostUsd(record) ?? costUsd;
  }

  return {
    response,
    usage,
    costUsd
  };
}

function parseJsonRecords(text: string): Record<string, unknown>[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const parsedWhole = tryParseJson(trimmed);
  if (isRecord(parsedWhole)) {
    return [parsedWhole];
  }
  if (Array.isArray(parsedWhole)) {
    return parsedWhole.filter(isRecord);
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => tryParseJson(line.trim()))
    .filter(isRecord);
}

function readResponse(record: Record<string, unknown>): string | undefined {
  for (const key of ["result", "response", "output", "text", "content"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const message = record.message;
  if (isRecord(message) && typeof message.content === "string") {
    return message.content.trim();
  }

  return undefined;
}

function readUsage(record: Record<string, unknown>): WorkerResult["usage"] | undefined {
  const usage = isRecord(record.usage) ? record.usage : undefined;
  if (!usage) {
    return undefined;
  }

  const inputTokens = readNumber(
    usage.inputTokens,
    usage.input_tokens,
    usage.prompt_tokens
  );
  const outputTokens = readNumber(
    usage.outputTokens,
    usage.output_tokens,
    usage.completion_tokens
  );
  const explicitTotal = readNumber(usage.totalTokens, usage.total_tokens);
  const totalTokens = explicitTotal || inputTokens + outputTokens;

  if (inputTokens === 0 && outputTokens === 0 && totalTokens === 0) {
    return undefined;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens
  };
}

function readCostUsd(record: Record<string, unknown>): number | undefined {
  const usage = isRecord(record.usage) ? record.usage : {};
  const value = readNumber(
    record.costUsd,
    record.cost_usd,
    record.totalCostUsd,
    record.total_cost_usd,
    usage.cost,
    usage.costUsd,
    usage.cost_usd,
    usage.total_cost_usd
  );

  return value > 0 ? value : undefined;
}

function readNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function defaultCommandRunner(
  command: string,
  args: string[],
  options: {
    cwd: string;
    input: string;
    env?: Record<string, string | undefined>;
    abortSignal?: AbortSignal;
  }
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  if (options.abortSignal?.aborted) {
    return {
      exitCode: 130,
      stdout: "",
      stderr: "Command canceled before start"
    };
  }

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
    let settled = false;
    const abort = () => {
      stderr += stderr ? "\nCommand canceled by signal" : "Command canceled by signal";
      child.kill("SIGTERM");
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    options.abortSignal?.addEventListener("abort", abort, { once: true });
    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      options.abortSignal?.removeEventListener("abort", abort);
      resolve({
        exitCode: options.abortSignal?.aborted ? 130 : code ?? 1,
        stdout,
        stderr
      });
    });
    child.stdin.end(options.input);
  });
}
