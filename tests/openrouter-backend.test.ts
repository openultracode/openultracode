import { OpenRouterBackend } from "../src/backends/openrouter.js";
import type { Task } from "../src/types.js";

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

test("OpenRouterBackend.fromEnv requires OPENROUTER_API_KEY", () => {
  expect(() =>
    OpenRouterBackend.fromEnv({
      env: {},
      model: "qwen/qwen3-coder:free"
    })
  ).toThrow("OPENROUTER_API_KEY is required");
});

test("OpenRouterBackend sends a chat completion request and maps the response", async () => {
  const requests: Array<{ url: string; init: OpenRouterRequestInit }> = [];
  const fetchImpl = async (
    url: string,
    init: OpenRouterRequestInit
  ): Promise<OpenRouterFetchResponse> => {
    requests.push({ url, init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        choices: [{ message: { content: "Implemented the report command." } }],
        usage: {
          prompt_tokens: 7,
          completion_tokens: 5,
          total_tokens: 12
        }
      })
    };
  };
  const backend = new OpenRouterBackend({
    apiKey: "test-openrouter-key",
    model: "qwen/qwen3-coder:free",
    fetchImpl,
    appTitle: "OpenUltraCode Tests",
    httpReferer: "https://github.com/AryaVora621/openultracode"
  });

  const result = await backend.run(makeTask());
  const request = requests[0];
  const body = JSON.parse(request.init.body) as {
    model: string;
    messages: Array<{ role: string; content: string }>;
  };

  expect(request.url).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(request.init.method).toBe("POST");
  expect(request.init.headers.Authorization).toBe("Bearer test-openrouter-key");
  expect(request.init.headers["Content-Type"]).toBe("application/json");
  expect(request.init.headers["X-OpenRouter-Title"]).toBe("OpenUltraCode Tests");
  expect(request.init.headers["HTTP-Referer"]).toBe(
    "https://github.com/AryaVora621/openultracode"
  );
  expect(body.model).toBe("qwen/qwen3-coder:free");
  expect(body.messages[0]).toMatchObject({ role: "system" });
  expect(body.messages[1].content).toContain("Implement report command");
  expect(result).toMatchObject({
    taskId: "task_1",
    status: "succeeded",
    response: "Implemented the report command.",
    usage: {
      inputTokens: 7,
      outputTokens: 5,
      totalTokens: 12
    },
    costUsd: 0
  });
});

test("OpenRouterBackend returns a failed worker result for non-OK responses", async () => {
  const backend = new OpenRouterBackend({
    apiKey: "test-openrouter-key",
    model: "qwen/qwen3-coder:free",
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: "rate limited" } })
    })
  });

  const result = await backend.run(makeTask());

  expect(result).toMatchObject({
    taskId: "task_1",
    status: "failed",
    response: "",
    error: "OpenRouter request failed with status 429: rate limited"
  });
});

type OpenRouterRequestInit = {
  method: string;
  headers: Record<string, string>;
  body: string;
};

type OpenRouterFetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};
