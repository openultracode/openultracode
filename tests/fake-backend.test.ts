import { FakeBackend } from "../src/backends/fake.js";
import type { Task } from "../src/types.js";

test("FakeBackend returns deterministic worker artifacts and usage", async () => {
  const backend = new FakeBackend({
    backend: "fake",
    model: "fake-model"
  });
  const task: Task = {
    id: "task_fake",
    title: "Inspect docs",
    intent: "research",
    importance: "low",
    modelTier: "free",
    fileScope: ["PLAN.md"],
    dependsOn: [],
    instructions: "Inspect the plan."
  };

  const result = await backend.run(task);

  expect(result.taskId).toBe("task_fake");
  expect(result.status).toBe("succeeded");
  expect(result.response).toContain("Inspect docs");
  expect(result.usage.totalTokens).toBeGreaterThan(0);
  expect(result.costUsd).toBe(0);
});
