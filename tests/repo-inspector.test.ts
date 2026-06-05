import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

import { inspectRepository } from "../src/repo-inspector.js";

test("inspectRepository records useful repo facts while ignoring generated folders", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "ouc-repo-"));
  await mkdir(join(projectRoot, "src"), { recursive: true });
  await mkdir(join(projectRoot, "node_modules", "leftpad"), { recursive: true });
  await mkdir(join(projectRoot, "dist"), { recursive: true });
  await mkdir(join(projectRoot, ".ouc", "runs"), { recursive: true });
  await writeFile(join(projectRoot, "package.json"), "{}");
  await writeFile(join(projectRoot, "package-lock.json"), "{}");
  await writeFile(join(projectRoot, "README.md"), "# Test");
  await writeFile(join(projectRoot, "src", "index.ts"), "export {};");
  await writeFile(join(projectRoot, "dist", "index.js"), "ignored");
  await writeFile(join(projectRoot, "node_modules", "leftpad", "index.js"), "ignored");
  await writeFile(join(projectRoot, ".ouc", "runs", "plan.json"), "ignored");

  const inspection = await inspectRepository(projectRoot);

  expect(inspection.projectRoot).toBe(projectRoot);
  expect(inspection.hasGit).toBe(false);
  expect(inspection.packageManager).toBe("npm");
  expect(inspection.files).toEqual(["README.md", "package-lock.json", "package.json", "src/index.ts"]);
  expect(inspection.summary.fileCount).toBe(4);
  expect(inspection.summary.languageHints).toContain("typescript");
});
