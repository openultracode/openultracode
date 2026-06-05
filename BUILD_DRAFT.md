# Build Draft

Timestamp: 2026-06-05 18:19 EDT

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
- Edit-task file ownership metadata and overlap detection in plan artifacts.
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
- OpenRouter model fallback attempts after failed mocked backend responses.
- Worker `result.json` artifacts preserve backend attempt history.
- Opt-in `ouc run --backend codex-cli` execution through `codex exec` in read-only sandbox mode.
- Opt-in `ouc run --backend claude-cli` execution through Claude print mode with plan permissions.
- Isolated git worktree creation for edit tasks.
- Worker `diff.patch`, `changed-files.json`, and `reconciliation.json` artifacts.
- Final-report reconciliation sections for clean, changed, skipped, failed, and conflict states.
- Conflict classification with `git apply --check`.
- Opt-in clean patch application through `--apply-clean-patches` or `patchApplication.applyCleanPatches`.
- Worker `patch-application.json` artifacts for applied, skipped, and failed application states.
- Patch application ledger events and final-report sections.
- `SIGINT` and `SIGTERM` cancellation through an `AbortController`.
- Worker-pool cancellation before execution and between tasks.
- Canceled CLI runs preserve stopped-run ledger and final report artifacts.
- Worker-pool `totalTokens` and `totalCostUsd` aggregation from actual worker results.
- Run JSON, run ledgers, and final reports include token and cost totals.
- Runtime `limits.maxCostUsd` enforcement from actual backend result costs.
- Pre-execution blocking for overlapping edit file ownership.
- File ownership metadata in `plan_created` ledger events.
- Deterministic edit-goal splitting into edit and dependent test tasks.
- Mixed implementation, test, and docs goals split into dependent code, verification, and docs tasks.
- Documentation-only goals stay scoped to README and `docs/` files.
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
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_fallback_chains_fake --json
node dist/bin/ouc.js plan "implement report command, add tests, and update README docs" --run-id run_smoke_planner_docs_20260605_1729 --json
node dist/bin/ouc.js plan "update README docs" --run-id run_smoke_docs_only_20260605_1729 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_cli_backends_fake_20260605_1736 --json
node dist/bin/ouc.js run "inspect this repo" --backend codex-cli --run-id run_smoke_codex_cli_parser_20260605_1736 --stop-after-task 0 --json
node dist/bin/ouc.js run "inspect this repo" --backend claude-cli --run-id run_smoke_claude_cli_parser_20260605_1736 --stop-after-task 0 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_worktree_reconcile_20260605_1746 --json
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built cancellation smoke */'
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built actual-cost cap smoke */'
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built clean-patch application smoke */'
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built file-ownership block smoke */'
npm pack --dry-run
```

Observed results:

- `npm test`: 14 test files, 57 tests passed.
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
- OpenRouter fallback tests verified a failed primary model can fall back to another configured OpenRouter model and preserve attempt history with mocked fetch only.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_fallback_chains_fake --json`: verified the default fake execution path still works after fallback handling.
- `node dist/bin/ouc.js plan "implement report command, add tests, and update README docs" --run-id run_smoke_planner_docs_20260605_1729 --json`: returned three planned tasks and a `$0.03` estimate.
- `node dist/bin/ouc.js plan "update README docs" --run-id run_smoke_docs_only_20260605_1729 --json`: returned one planned task and a `$0.01` estimate.
- Codex CLI backend tests verified `codex exec` argument mapping, read-only sandbox mode, stdout capture, and nonzero exit mapping with mocked command runners only.
- Claude CLI backend tests verified `claude -p` argument mapping, plan permissions, stdout capture, and CLI wiring with mocked command runners only.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_cli_backends_fake_20260605_1736 --json`: verified fake execution still succeeds after CLI backend wiring.
- `node dist/bin/ouc.js run "inspect this repo" --backend codex-cli --run-id run_smoke_codex_cli_parser_20260605_1736 --stop-after-task 0 --json`: returned expected stopped status before any Codex worker command executed.
- `node dist/bin/ouc.js run "inspect this repo" --backend claude-cli --run-id run_smoke_claude_cli_parser_20260605_1736 --stop-after-task 0 --json`: returned expected stopped status before any Claude worker command executed.
- Worktree reconciliation tests verified isolated git worktree command mapping, diff artifact capture, and conflict classification.
- `node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_worktree_reconcile_20260605_1746 --json`: wrote edit-task `reconciliation.json`, empty `diff.patch`, skipped test-task reconciliation, and a final-report reconciliation section.
- Cancellation tests verified worker-pool aborts, stopped CLI artifacts, signal handler cleanup, and abort-signal propagation into CLI command backends.
- Built cancellation smoke returned exit 1 with status `stopped`, reason `Run canceled before task execution.`, and preserved stopped-run artifact paths.
- Cost accounting tests verified worker-pool token totals, runtime actual-cost stopping, stopped-run token/cost JSON, ledger totals, and final-report totals.
- Built actual-cost cap smoke returned exit 1 after one mocked OpenRouter call with status `stopped`, total cost `$0.04`, and total tokens `18`.
- Patch application tests verified default no-apply behavior, CLI flag opt-in, config opt-in, `patch-application.json`, ledger events, final-report metadata, and safe refusal for conflict states.
- Built clean-patch application smoke applied a mocked worktree change to the main checkout only when `--apply-clean-patches` was present.
- File ownership tests verified edit-task ownership metadata, conflict detection, `plan_created` ledger metadata, and pre-worker blocking for overlapping edit scopes.
- Built file-ownership block smoke returned exit 1 with status `blocked`, `limit` `fileOwnership`, and no worker result artifacts.
- `ouc plan` argument validation rejects a missing `--run-id` value.
- `npm pack --dry-run`: package is named `openultracode`, includes 14 built runtime files, 17 files total, and only emits `dist/bin/ouc.js` for the CLI binary.

## Next Step

Continue Phase 2 by adding provider-specific usage parsing for local CLI backends when structured usage is available.
