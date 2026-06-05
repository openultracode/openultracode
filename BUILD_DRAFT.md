# Build Draft

Timestamp: 2026-06-05 16:46 EDT

GitHub: https://github.com/AryaVora621/openultracode

## Current Draft Scope

Phase 1 foundation is implemented as a local TypeScript CLI package.
The current draft also includes the first bounded Phase 2 fake-backend execution path.

Included:

- `package.json` named `openultracode` with `ouc` and `openultracode` binary aliases.
- TypeScript build and typecheck configuration.
- Vitest test setup.
- Typed config loading with safe defaults and zod validation.
- Local run artifact directory helper for `.ouc/runs/<run-id>/`.
- Initial task classification and model routing.
- Deterministic fake backend for worker tests.
- CLI help entry point and built bin wrapper.
- README and MIT license draft using the default plan recommendation.
- Deterministic repo inspection that ignores generated folders.
- `ouc plan "<goal>"` dry-run command that writes `.ouc/runs/<run-id>/plan.json`.
- `ouc status <run-id>` command that summarizes the local plan artifact.
- `ouc report <run-id>` command that prints a markdown summary for planned runs.
- `ledger.jsonl` creation during `ouc plan`.
- `final-report.md` persistence during `ouc report`, while preserving existing final reports.
- `ouc run "<goal>" --backend fake` execution against deterministic fake workers.
- Worker `response.md` and `result.json` artifacts for fake runs.
- Task-level ledger events and final execution reports for fake runs.
- `ouc run` refuses to overwrite an existing `final-report.md`.
- Deterministic edit-goal splitting into edit and dependent test tasks.
- Edit task source scopes prefer implementation files over docs and tracker files.
- JSON output modes for `ouc plan ... --json` and `ouc status <run-id> --json`.
- `ouc plan` rejects `--run-id` when the value is missing.
- Public contributor docs: `README.md`, `CONTRIBUTING.md`, `PROJECT_STATUS.md`, and `AGENTS.md`.

## Verification Evidence

Commands run on 2026-06-05:

```bash
npm test
npm run typecheck
npm run build
node dist/bin/ouc.js --help
node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_smoke_ouc_rename --json
node dist/bin/ouc.js status run_smoke_ouc_rename --json
node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_smoke_20260605_1312
node dist/bin/ouc.js status run_smoke_20260605_1312
node dist/bin/ouc.js report run_smoke_20260605_1312
node dist/bin/ouc.js plan "implement JSON output and test it" --run-id run_smoke_planjson_20260605_1329 --json
node dist/bin/ouc.js status run_smoke_artifacts_20260605_1322 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_fake --json
npm pack --dry-run
```

Observed results:

- `npm test`: 8 test files, 21 tests passed.
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0.
- `node dist/bin/ouc.js --help`: printed the CLI help with `plan`, `run`, `status`, and `report`.
- `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_smoke_ouc_rename --json`: wrote `.ouc/runs/run_smoke_ouc_rename/plan.json`.
- `node dist/bin/ouc.js status run_smoke_ouc_rename --json`: printed machine-readable local run state from `.ouc`.
- `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_smoke_20260605_1312`: wrote `.ouc/runs/run_smoke_20260605_1312/plan.json`.
- `node dist/bin/ouc.js status run_smoke_20260605_1312`: printed run id, goal, one planned task, and `$0.00` estimate.
- `node dist/bin/ouc.js report run_smoke_20260605_1312`: printed a markdown run summary and noted no worker execution has run yet.
- `node dist/bin/ouc.js plan "implement JSON output and test it" --run-id run_smoke_planjson_20260605_1329 --json`: printed run id, goal, two-task count, cost estimate, plan path, and ledger path as JSON.
- `node dist/bin/ouc.js status run_smoke_artifacts_20260605_1322 --json`: printed machine-readable local run state with ledger and final report presence.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_fake --json`: executed two fake tasks, wrote worker artifacts, task ledger events, and `final-report.md`.
- `ouc plan` argument validation rejects a missing `--run-id` value.
- `npm pack --dry-run`: package is named `openultracode`, includes 12 runtime files, and only emits `dist/bin/ouc.js` for the CLI binary.

## Next Step

Continue Phase 2 by adding budget and max-task enforcement to fake runs before any external model calls.
