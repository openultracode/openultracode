import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("package exposes ouc and openultracode aliases to the same built CLI", async () => {
  const pkg = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8")
  ) as {
    bin: Record<string, string>;
    files: string[];
    scripts: Record<string, string>;
  };

  expect(pkg.bin.ouc).toBe("dist/bin/ouc.js");
  expect(pkg.bin.openultracode).toBe(pkg.bin.ouc);
  expect(pkg.files).toContain("docs");
  expect(pkg.files).toContain("examples");
  expect(pkg.files).toContain("CODE_OF_CONDUCT.md");
  expect(pkg.scripts.build).toContain("tsc");
  expect(pkg.scripts.test).toContain("vitest");
});

test("package exposes the same verification gate used by CI and release docs", async () => {
  const pkg = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8")
  ) as {
    scripts: Record<string, string>;
  };
  const ciWorkflow = await readFile(
    resolve(process.cwd(), ".github", "workflows", "ci.yml"),
    "utf8"
  );
  const releaseChecklist = await readFile(
    resolve(process.cwd(), "docs", "RELEASE_CHECKLIST.md"),
    "utf8"
  );

  expect(typeof pkg.scripts.verify).toBe("string");
  expect(pkg.scripts.verify).toContain("npm test");
  expect(pkg.scripts.verify).toContain("npm run typecheck");
  expect(pkg.scripts.verify).toContain("npm run build");
  expect(pkg.scripts.verify).toContain("npm pack --dry-run");
  expect(ciWorkflow).toContain("npm run verify");
  expect(releaseChecklist).toContain("npm run verify");
});

test("package exposes a local release check script for final preflight", async () => {
  const pkg = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8")
  ) as {
    scripts: Record<string, string>;
  };
  const publishingGuide = await readFile(
    resolve(process.cwd(), "docs", "PUBLISHING.md"),
    "utf8"
  );
  const releaseDecisions = await readFile(
    resolve(process.cwd(), "docs", "RELEASE_DECISIONS.md"),
    "utf8"
  );

  expect(pkg.scripts["release:check"]).toBe("npm run verify && npm publish --dry-run");
  expect(publishingGuide).toContain("npm run release:check");
  expect(releaseDecisions).toContain("npm run release:check");
});
