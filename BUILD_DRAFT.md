# Build Draft

Timestamp: 2026-06-05 17:17 EDT

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
- Preflight `limits.maxTasks` and `limits.maxCostUsd` enforcement for fake runs.
- Blocked-run JSON, ledger, and final report artifacts for limit stops.
- `--stop-after-task` stopped-run reporting for fake runs.
- Partial-run final reports that show succeeded, remaining, and not-run tasks.
- Worker-pool sequencing module behind fake runs.
- OpenRouter backend module with env-key loading, request mapping, response mapping, and mocked fetch tests.
- Opt-in `ouc run --backend openrouter` execution wiring, covered with mocked CLI tests.
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
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_budget_success --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_stopped --stop-after-task 1 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_pool_success --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_pool_stopped --stop-after-task 1 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_openrouter_wiring_fake --json
npm pack --dry-run
```

Observed results:

- `npm test`: 10 test files, 31 tests passed.
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
- Built blocked-run smoke against a temporary fixture returned exit 1 with status `blocked`, wrote `run_blocked` ledger state, and did not execute workers when `limits.maxTasks` was exceeded.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_stopped --stop-after-task 1 --json`: returned exit 1 with status `stopped`, wrote one worker result, one remaining task, `run_stopped` ledger state, and a partial final report.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_pool_success --json`: verified the refactored worker-pool success path.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_pool_stopped --stop-after-task 1 --json`: verified the refactored worker-pool stopped path.
- OpenRouter backend tests verified env-key loading, request headers/body, response usage mapping, and HTTP error mapping with mocked fetch only.
- OpenRouter CLI wiring tests verified explicit backend selection, env-key refusal before artifacts, mocked fetch execution, and no live API calls.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_openrouter_wiring_fake --json`: verified the default fake execution path still works after OpenRouter wiring.
- `ouc plan` argument validation rejects a missing `--run-id` value.
- `npm pack --dry-run`: package is named `openultracode`, includes 12 runtime files, and only emits `dist/bin/ouc.js` for the CLI binary.

## Next Step

Continue Phase 2 by expanding router fallback chains for real backend failure modes.
