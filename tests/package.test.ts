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
