import { analyzeFileOwnership, findFileOwnershipViolation } from "../src/file-ownership.js";
import type { Task } from "../src/types.js";

test("analyzeFileOwnership records edit task owners and conflicts by file", () => {
  const report = analyzeFileOwnership([
    makeTask("task_1", "edit", ["src/cli.ts", "src/planner.ts"]),
    makeTask("task_2", "test", ["src/cli.ts"]),
    makeTask("task_3", "edit", ["src/cli.ts", "README.md"])
  ]);

  expect(report).toEqual({
    hasConflicts: true,
    files: [
      {
        path: "README.md",
        ownerTaskIds: ["task_3"],
        conflict: false
      },
      {
        path: "src/cli.ts",
        ownerTaskIds: ["task_1", "task_3"],
        conflict: true
      },
      {
        path: "src/planner.ts",
        ownerTaskIds: ["task_1"],
        conflict: false
      }
    ],
    conflicts: [
      {
        path: "src/cli.ts",
        ownerTaskIds: ["task_1", "task_3"],
        conflict: true
      }
    ]
  });
});

test("findFileOwnershipViolation explains the first overlapping edit scope", () => {
  const report = analyzeFileOwnership([
    makeTask("task_1", "edit", ["src/cli.ts"]),
    makeTask("task_2", "edit", ["src/cli.ts"])
  ]);

  expect(findFileOwnershipViolation(report)).toEqual({
    reason: "File ownership conflict: src/cli.ts is claimed by task_1, task_2."
  });
});

function makeTask(
  id: string,
  intent: Task["intent"],
  fileScope: string[]
): Task {
  return {
    id,
    title: id,
    intent,
    importance: "normal",
    modelTier: "strong",
    fileScope,
    dependsOn: [],
    instructions: id
  };
}
