import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("package exposes cuc and codexultracode aliases to the same built CLI", async () => {
  const pkg = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8")
  ) as {
    bin: Record<string, string>;
    scripts: Record<string, string>;
  };

  expect(pkg.bin.cuc).toBe("./dist/bin/cuc.js");
  expect(pkg.bin.codexultracode).toBe("./dist/bin/cuc.js");
  expect(pkg.scripts.build).toContain("tsc");
  expect(pkg.scripts.test).toContain("vitest");
});
