import type { Task } from "./types.js";

export type FileOwnershipEntry = {
  path: string;
  ownerTaskIds: string[];
  conflict: boolean;
};

export type FileOwnershipReport = {
  hasConflicts: boolean;
  files: FileOwnershipEntry[];
  conflicts: FileOwnershipEntry[];
};

export type FileOwnershipViolation = {
  reason: string;
};

export function analyzeFileOwnership(tasks: Task[]): FileOwnershipReport {
  const ownersByPath = new Map<string, string[]>();

  for (const task of tasks) {
    if (task.intent !== "edit") {
      continue;
    }

    for (const file of uniqueFileScope(task.fileScope)) {
      const owners = ownersByPath.get(file) ?? [];
      owners.push(task.id);
      ownersByPath.set(file, owners);
    }
  }

  const files = [...ownersByPath.entries()]
    .map(([path, ownerTaskIds]) => ({
      path,
      ownerTaskIds,
      conflict: ownerTaskIds.length > 1
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const conflicts = files.filter((file) => file.conflict);

  return {
    hasConflicts: conflicts.length > 0,
    files,
    conflicts
  };
}

export function findFileOwnershipViolation(
  report: FileOwnershipReport
): FileOwnershipViolation | undefined {
  const conflict = report.conflicts[0];

  if (!conflict) {
    return undefined;
  }

  return {
    reason: `File ownership conflict: ${conflict.path} is claimed by ${conflict.ownerTaskIds.join(", ")}.`
  };
}

function uniqueFileScope(fileScope: string[]): string[] {
  return [...new Set(fileScope.map((file) => file.trim()).filter(Boolean))];
}
