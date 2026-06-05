import type { ModelAssignment, Task, WorkerResult } from "../types.js";

export class FakeBackend {
  constructor(private readonly assignment: ModelAssignment) {}

  async run(task: Task): Promise<WorkerResult> {
    const response = [
      `Fake backend ${this.assignment.model} completed ${task.id}.`,
      `Title: ${task.title}`,
      `Instructions: ${task.instructions}`
    ].join("\n");
    const inputTokens = countTokens(task.instructions) + countTokens(task.title);
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

function countTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, words.length);
}
