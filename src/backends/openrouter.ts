import type { Task, WorkerResult } from "../types.js";

const DEFAULT_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_APP_TITLE = "OpenUltraCode";

export type OpenRouterBackendOptions = {
  apiKey: string;
  model: string;
  endpoint?: string;
  fetchImpl?: OpenRouterFetch;
  appTitle?: string;
  httpReferer?: string;
};

export type OpenRouterBackendFromEnvOptions = Omit<
  OpenRouterBackendOptions,
  "apiKey"
> & {
  env?: Record<string, string | undefined>;
};

export type OpenRouterFetch = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export class OpenRouterBackend {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint: string;
  private readonly fetchImpl: OpenRouterFetch;
  private readonly appTitle: string;
  private readonly httpReferer?: string;

  constructor(options: OpenRouterBackendOptions) {
    if (!options.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }

    this.apiKey = options.apiKey;
    this.model = options.model;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.fetchImpl = options.fetchImpl ?? defaultFetch;
    this.appTitle = options.appTitle ?? DEFAULT_APP_TITLE;
    this.httpReferer = options.httpReferer;
  }

  static fromEnv(options: OpenRouterBackendFromEnvOptions): OpenRouterBackend {
    const env = options.env ?? process.env;

    return new OpenRouterBackend({
      ...options,
      apiKey: env.OPENROUTER_API_KEY ?? ""
    });
  }

  async run(task: Task): Promise<WorkerResult> {
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an OpenUltraCode worker. Complete only the assigned task."
            },
            {
              role: "user",
              content: renderTaskPrompt(task)
            }
          ]
        })
      });
      const raw = await response.text();
      const body = parseJsonObject(raw);

      if (!response.ok) {
        return failedResult(
          task,
          `OpenRouter request failed with status ${response.status}: ${extractErrorMessage(body)}`
        );
      }

      const content = extractAssistantContent(body);
      if (!content) {
        return failedResult(task, "OpenRouter response did not include assistant content");
      }

      return {
        taskId: task.id,
        status: "succeeded",
        response: content,
        usage: extractUsage(body),
        costUsd: extractCostUsd(body)
      };
    } catch (error) {
      return failedResult(
        task,
        error instanceof Error ? error.message : "OpenRouter request failed"
      );
    }
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": this.appTitle
    };

    if (this.httpReferer) {
      headers["HTTP-Referer"] = this.httpReferer;
    }

    return headers;
  }
}

function renderTaskPrompt(task: Task): string {
  return [
    `Task: ${task.title}`,
    `Intent: ${task.intent}`,
    `Importance: ${task.importance}`,
    `Files: ${task.fileScope.join(", ") || "none"}`,
    "",
    task.instructions
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

function extractAssistantContent(body: Record<string, unknown>): string | undefined {
  const choices = body.choices;
  if (!Array.isArray(choices)) {
    return undefined;
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) {
    return undefined;
  }

  const message = firstChoice.message;
  if (!isRecord(message) || typeof message.content !== "string") {
    return undefined;
  }

  return message.content;
}

function extractUsage(body: Record<string, unknown>): WorkerResult["usage"] {
  const usage = isRecord(body.usage) ? body.usage : {};
  const inputTokens = readNumber(usage.prompt_tokens);
  const outputTokens = readNumber(usage.completion_tokens);
  const totalTokens = readNumber(usage.total_tokens) || inputTokens + outputTokens;

  return {
    inputTokens,
    outputTokens,
    totalTokens
  };
}

function extractCostUsd(body: Record<string, unknown>): number {
  const usage = isRecord(body.usage) ? body.usage : {};
  return readNumber(usage.cost);
}

function extractErrorMessage(body: Record<string, unknown>): string {
  const error = body.error;
  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }
  return "unknown error";
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("OpenRouter response was not a JSON object");
  }
  return parsed;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function defaultFetch(
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }
): Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}> {
  if (!globalThis.fetch) {
    throw new Error("Global fetch is not available");
  }

  return globalThis.fetch(url, init);
}
