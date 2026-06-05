import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export type RunArtifacts = {
  runId: string;
  runDir: string;
  workersDir: string;
  worktreesDir: string;
  planPath: string;
  ledgerPath: string;
  finalReportPath: string;
};

export async function createRunArtifacts(
  projectRoot: string,
  runId = createRunId()
): Promise<RunArtifacts> {
  const runDir = join(projectRoot, ".ouc", "runs", runId);
  const workersDir = join(runDir, "workers");
  const worktreesDir = join(runDir, "worktrees");

  await mkdir(workersDir, { recursive: true });
  await mkdir(worktreesDir, { recursive: true });

  return {
    runId,
    runDir,
    workersDir,
    worktreesDir,
    planPath: join(runDir, "plan.json"),
    ledgerPath: join(runDir, "ledger.jsonl"),
    finalReportPath: join(runDir, "final-report.md")
  };
}

function createRunId(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `run_${stamp}_${Math.random().toString(36).slice(2, 8)}`;
}
