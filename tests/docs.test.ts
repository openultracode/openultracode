import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("artifact reference guide is package-linked from contributor entrypoints", async () => {
  const artifactGuidePath = resolve(process.cwd(), "docs", "ARTIFACTS.md");
  const readme = await readFile(resolve(process.cwd(), "README.md"), "utf8");
  const contributing = await readFile(resolve(process.cwd(), "CONTRIBUTING.md"), "utf8");

  await expect(access(artifactGuidePath)).resolves.toBeUndefined();
  expect(readme).toContain("docs/ARTIFACTS.md");
  expect(contributing).toContain("docs/ARTIFACTS.md");
});
