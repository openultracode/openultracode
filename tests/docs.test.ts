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

test("backend module guide is package-linked from contributor entrypoints", async () => {
  const backendGuidePath = resolve(process.cwd(), "docs", "BACKENDS.md");
  const backendGuide = await readFile(backendGuidePath, "utf8");
  const readme = await readFile(resolve(process.cwd(), "README.md"), "utf8");
  const contributing = await readFile(resolve(process.cwd(), "CONTRIBUTING.md"), "utf8");
  const requiredSections = [
    "## Worker Backend Contract",
    "## Fake Backend",
    "## OpenRouter Backend",
    "## CLI Backends",
    "## Reconciliation Boundary",
  ];
  const requiredPaths = [
    "src/backends/fake.ts",
    "src/backends/openrouter.ts",
    "src/backends/cli-command.ts",
    "src/worker-pool.ts",
    "src/worktree-reconciler.ts",
  ];

  expect(readme).toContain("docs/BACKENDS.md");
  expect(contributing).toContain("docs/BACKENDS.md");
  for (const section of requiredSections) {
    expect(backendGuide).toContain(section);
  }
  for (const path of requiredPaths) {
    expect(backendGuide).toContain(path);
  }
});

test("artifact reference guide includes checked JSON examples", async () => {
  const artifactGuide = await readFile(resolve(process.cwd(), "docs", "ARTIFACTS.md"), "utf8");
  const expectedSections = [
    "## JSON Examples",
    "### plan.json Example",
    "### ledger.jsonl Example",
    "### result.json Example",
  ];

  for (const section of expectedSections) {
    expect(artifactGuide).toContain(section);
  }

  const jsonExamplePattern = /```json\n([\s\S]*?)\n```/g;
  const jsonExamples = [...artifactGuide.matchAll(jsonExamplePattern)].map((match) => match[1]);
  expect(jsonExamples.length).toBeGreaterThanOrEqual(2);

  for (const example of jsonExamples) {
    expect(() => JSON.parse(example)).not.toThrow();
  }

  const jsonlExamplePattern = /```jsonl\n([\s\S]*?)\n```/g;
  const jsonlExamples = [...artifactGuide.matchAll(jsonlExamplePattern)].map((match) => match[1]);
  expect(jsonlExamples.length).toBeGreaterThanOrEqual(1);

  for (const example of jsonlExamples) {
    for (const line of example.split("\n")) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  }
});

test("artifact reference guide documents ledger event schemas", async () => {
  const artifactGuide = await readFile(resolve(process.cwd(), "docs", "ARTIFACTS.md"), "utf8");
  const requiredSections = [
    "## Ledger Event Schemas",
    "### Planning Events",
    "### Task Events",
    "### Patch Events",
    "### Run Events",
  ];
  const requiredEvents = [
    "`plan_created`",
    "`task_started`",
    "`task_reconciled`",
    "`task_patch_application`",
    "`task_finished`",
    "`run_finished`",
    "`run_stopped`",
    "`run_blocked`",
  ];

  for (const section of requiredSections) {
    expect(artifactGuide).toContain(section);
  }

  for (const event of requiredEvents) {
    expect(artifactGuide).toContain(event);
  }
});

test("model routing guide documents safety tradeoffs for each backend family", async () => {
  const modelRoutingGuide = await readFile(
    resolve(process.cwd(), "docs", "MODEL_ROUTING.md"),
    "utf8"
  );
  const examplesReadme = await readFile(
    resolve(process.cwd(), "examples", "README.md"),
    "utf8"
  );
  const requiredRows = [
    "| Fake |",
    "| Local CLI |",
    "| OpenRouter |"
  ];

  expect(modelRoutingGuide).toContain("## Backend Safety Matrix");
  expect(modelRoutingGuide).toContain("examples/config.advanced-routing.json");
  expect(examplesReadme).toContain("config.advanced-routing.json");

  for (const row of requiredRows) {
    expect(modelRoutingGuide).toContain(row);
  }
});

test("publishing guide documents exact post-billing CI rerun commands", async () => {
  const publishingGuide = await readFile(resolve(process.cwd(), "docs", "PUBLISHING.md"), "utf8");
  const releaseDecisions = await readFile(
    resolve(process.cwd(), "docs", "RELEASE_DECISIONS.md"),
    "utf8"
  );

  expect(publishingGuide).toContain("## After Billing Unlock");
  expect(publishingGuide).toContain(
    "gh workflow run ci.yml --repo openultracode/openultracode --ref main"
  );
  expect(publishingGuide).toContain("gh run watch --repo openultracode/openultracode");
  expect(publishingGuide).toContain("gh run view");
  expect(releaseDecisions).toContain("docs/PUBLISHING.md#after-billing-unlock");
});

test("contributor starter map is linked and points contributors to tested lanes", async () => {
  const starterMapPath = resolve(process.cwd(), "docs", "CONTRIBUTOR_STARTER_MAP.md");
  const starterMap = await readFile(starterMapPath, "utf8");
  const readme = await readFile(resolve(process.cwd(), "README.md"), "utf8");
  const contributing = await readFile(resolve(process.cwd(), "CONTRIBUTING.md"), "utf8");

  expect(readme).toContain("docs/CONTRIBUTOR_STARTER_MAP.md");
  expect(contributing).toContain("docs/CONTRIBUTOR_STARTER_MAP.md");
  expect(starterMap).toContain("## Contribution Lanes");
  expect(starterMap).toContain("## Starter Task Shape");

  const requiredLanes = [
    "Planner heuristics",
    "Backend adapters",
    "Run artifacts",
    "Safety controls",
    "Contributor docs",
  ];
  const requiredTestSurfaces = [
    "tests/planner-fixtures.test.ts",
    "tests/cli.test.ts",
    "tests/config.test.ts",
    "tests/docs.test.ts",
  ];

  for (const lane of requiredLanes) {
    expect(starterMap).toContain(lane);
  }

  for (const testSurface of requiredTestSurfaces) {
    expect(starterMap).toContain(testSurface);
  }
});
