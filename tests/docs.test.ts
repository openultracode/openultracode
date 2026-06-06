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
