import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "**/.git/**", "tests/fixtures/**"],
    include: ["tests/**/*.test.ts"],
    restoreMocks: true
  }
});
