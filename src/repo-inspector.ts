import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export type RepositoryInspection = {
  projectRoot: string;
  hasGit: boolean;
  packageManager: PackageManager;
  files: string[];
  summary: {
    fileCount: number;
    languageHints: string[];
    hasTests: boolean;
  };
};

const IGNORED_DIRS = new Set([
  ".ouc",
  ".git",
  ".worktrees",
  "coverage",
  "dist",
  "node_modules"
]);

export async function inspectRepository(
  projectRoot: string
): Promise<RepositoryInspection> {
  const files = await listProjectFiles(projectRoot);

  return {
    projectRoot,
    hasGit: await pathIsDirectory(join(projectRoot, ".git")),
    packageManager: detectPackageManager(files),
    files,
    summary: {
      fileCount: files.length,
      languageHints: detectLanguageHints(files),
      hasTests: files.some((file) => /(^|\/)(tests?|__tests__)\//.test(file) || /\.test\.[cm]?[jt]sx?$/.test(file))
    }
  };
}

async function listProjectFiles(projectRoot: string): Promise<string[]> {
  const output: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = join(directory, entry.name);
      const relativePath = relative(projectRoot, fullPath);

      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }

      if (entry.isFile()) {
        output.push(relativePath.split("\\").join("/"));
      }
    }
  }

  await visit(projectRoot);
  return output.sort(comparePaths);
}

function detectPackageManager(files: string[]): PackageManager {
  if (files.includes("pnpm-lock.yaml")) {
    return "pnpm";
  }
  if (files.includes("yarn.lock")) {
    return "yarn";
  }
  if (files.includes("bun.lockb") || files.includes("bun.lock")) {
    return "bun";
  }
  if (files.includes("package-lock.json") || files.includes("package.json")) {
    return "npm";
  }
  return "unknown";
}

function detectLanguageHints(files: string[]): string[] {
  const hints = new Set<string>();

  for (const file of files) {
    if (/\.[cm]?tsx?$/.test(file)) {
      hints.add("typescript");
    } else if (/\.jsx?$/.test(file)) {
      hints.add("javascript");
    } else if (/\.py$/.test(file)) {
      hints.add("python");
    } else if (/\.rs$/.test(file)) {
      hints.add("rust");
    } else if (/\.go$/.test(file)) {
      hints.add("go");
    }
  }

  return [...hints].sort(comparePaths);
}

function comparePaths(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

async function pathIsDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
