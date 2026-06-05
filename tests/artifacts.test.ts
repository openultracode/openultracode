import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

import { createRunArtifacts } from "../src/run-artifacts.js";

test("createRunArtifacts creates the run directory layout without deleting existing files", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-artifacts-"));
  const existingRunDir = join(projectRoot, ".ouc", "runs", "run_fixed");
  await mkdir(existingRunDir, { recursive: true });
  const existingPath = join(existingRunDir, "keep.txt");
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(existingPath, "preserve")
  );

  const artifacts = await createRunArtifacts(projectRoot, "run_fixed");

  await expect(stat(artifacts.runDir)).resolves.toMatchObject({
    isDirectory: expect.any(Function)
  });
  await expect(stat(artifacts.workersDir)).resolves.toBeDefined();
  await expect(readFile(existingPath, "utf8")).resolves.toBe("preserve");
  expect(artifacts.planPath).toBe(join(existingRunDir, "plan.json"));
  expect(artifacts.ledgerPath).toBe(join(existingRunDir, "ledger.jsonl"));
  expect(artifacts.finalReportPath).toBe(join(existingRunDir, "final-report.md"));
});
