import { loadConfig } from "../src/config.js";
import { classifyTask, routeTask } from "../src/router.js";
import type { Task } from "../src/types.js";

test("classifyTask assigns low-risk summaries to free and edits to strong", () => {
  expect(classifyTask({ intent: "summarize", importance: "low" })).toBe("free");
  expect(classifyTask({ intent: "research", importance: "normal" })).toBe("free");
  expect(classifyTask({ intent: "edit", importance: "normal" })).toBe("strong");
  expect(classifyTask({ intent: "test", importance: "high" })).toBe("strong");
  expect(classifyTask({ intent: "review", importance: "critical" })).toBe(
    "critical"
  );
});

test("routeTask returns configured backend and free-first fallback chain", async () => {
  const config = await loadConfig(process.cwd());
  const task: Task = {
    id: "task_1",
    title: "Summarize docs",
    intent: "summarize",
    importance: "low",
    modelTier: "free",
    fileScope: ["README.md"],
    dependsOn: [],
    instructions: "Summarize the README."
  };

  const route = routeTask(task, config);

  expect(route.tier).toBe("free");
  expect(route.primary.backend).toBe("openrouter");
  expect(route.primary.model).toBe(config.profiles.balanced.free.models[0]);
  expect(route.fallbacks.map((fallback) => fallback.model)).toContain(
    config.profiles.balanced.cheap.model
  );
});
