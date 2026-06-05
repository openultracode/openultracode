# Project Status

Last updated: 2026-06-05 18:24 EDT

Public repo: https://github.com/AryaVora621/openultracode

## Current State

OpenUltraCode is an early local CLI foundation. Fake workers remain the safe default, external backends are explicit opt-in, edit tasks in git repos get ownership checks, isolated worktree and reconciliation artifacts, clean patch application is explicit opt-in, local CLI structured usage is parsed when available, cancellation preserves stopped-run artifacts, and worker result accounting now drives token and cost totals.

Implemented:

- TypeScript Node package.
- npm package name `openultracode`.
- CLI aliases `ouc` and `openultracode`.
- Config loading and validation with zod.
- Local run artifact layout.
- Repo inspection.
- Deterministic dry-run planning.
- Mixed implementation, test, and docs task decomposition.
- Documentation-only goals scoped to contributor docs.
- Edit-task file ownership metadata and overlap detection in plan artifacts.
- Model-tier routing.
- `ouc plan`, `ouc run`, `ouc status`, and `ouc report`.
- JSON output for `plan`, `run`, and `status`.
- `ledger.jsonl` creation during planning.
- Task-level `ledger.jsonl` events during fake runs.
- Worker response and result artifacts for fake runs.
- `final-report.md` creation, execution summaries, and preservation.
- Fake backend class for deterministic execution and tests.
- Refusal to overwrite an existing final report during `ouc run`.
- Preflight `limits.maxTasks` and `limits.maxCostUsd` enforcement for fake runs.
- Blocked-run JSON, ledger, and final report artifacts for limit stops.
- `--stop-after-task` stopped-run reporting for fake runs.
- Partial-run final reports that show succeeded, remaining, and not-run tasks.
- Worker-pool sequencing module behind fake runs.
- OpenRouter backend module with `OPENROUTER_API_KEY` env loading, request headers, response mapping, and mocked fetch tests.
- Opt-in `ouc run --backend openrouter` execution wiring, covered with mocked CLI tests.
- OpenRouter model fallback attempts for failed worker results.
- Worker `result.json` artifacts preserve backend attempt history.
- Codex CLI backend using `codex exec` in read-only sandbox mode.
- Claude CLI backend using `claude -p` with plan permissions.
- Codex CLI JSONL usage parsing when structured events are available.
- Claude CLI JSON usage parsing when structured results are available.
- Heuristic token counting fallback for plain-text CLI output.
- Pre-execution blocking for overlapping edit file ownership.
- File ownership metadata in `plan_created` ledger events.
- Isolated git worktree creation for edit tasks.
- Worker `diff.patch`, `changed-files.json`, and `reconciliation.json` artifacts.
- Final-report reconciliation sections for clean, changed, skipped, failed, and conflict states.
- Conflict classification with `git apply --check`.
- Opt-in `--apply-clean-patches` flag for applying clean changed worker patches.
- Opt-in `patchApplication.applyCleanPatches` config switch.
- Worker `patch-application.json` artifacts for applied, skipped, and failed application states.
- Patch application ledger events and final-report sections.
- Real `SIGINT` and `SIGTERM` cancellation through an `AbortController`.
- Worker-pool cancellation before execution and between tasks.
- Canceled CLI runs preserve stopped-run ledger and final report artifacts.
- Worker-pool `totalTokens` and `totalCostUsd` aggregation from actual worker results.
- Run JSON, run ledgers, and final reports include token and cost totals.
- Runtime `limits.maxCostUsd` enforcement from actual backend result costs.
- Test suite covering current behavior.

Not implemented yet:

- Contributor issue templates and release-readiness examples.

## Verification Snapshot

Latest verified commands:

```bash
npm test
npm run typecheck
npm run build
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
node --input-type=module -e 'import { CodexCliBackend, ClaudeCliBackend } from "./dist/src/backends/cli-command.js"; /* built CLI usage parsing smoke */'
npm pack --dry-run
```

Latest known result:

- 13 test files passed.
- 59 tests passed.
- Typecheck passed.
- Build passed.
- Package dry-run passed.
- Built CLI success smoke passed with `node dist/bin/ouc.js run ... --backend fake --json`.
- Built CLI blocked-run smoke against a temporary fixture returned status `blocked` with exit 1 when `limits.maxTasks` was exceeded.
- Built CLI stopped-run smoke returned status `stopped`, succeeded 1 task, and left 1 task remaining.
- Built CLI success and stopped smokes passed through the worker-pool path.
- OpenRouter backend tests used mocked fetch only and made no live API calls.
- OpenRouter CLI wiring tests used mocked fetch only and made no live API calls.
- OpenRouter fallback tests used mocked fetch only and verified failed attempt preservation.
- Built CLI mixed planner smoke returned 3 tasks with a `$0.03` estimate.
- Built CLI docs-only planner smoke returned 1 task with a `$0.01` estimate.
- Codex CLI backend tests used mocked command runners only and made no real worker calls.
- Claude CLI backend tests used mocked command runners only and made no real worker calls.
- Built CLI fake run still succeeded after CLI backend wiring.
- Built CLI Codex and Claude backend parser smokes stopped before task execution and made no real worker calls.
- Worktree reconciliation tests verified isolated git worktree command mapping, diff artifact capture, and conflict classification.
- Built CLI worktree reconciliation smoke wrote edit-task `reconciliation.json`, empty `diff.patch`, skipped test-task reconciliation, and a final-report reconciliation section.
- Cancellation tests verified worker-pool aborts, CLI stopped artifacts, signal handler cleanup, and abort-signal propagation into CLI command backends.
- Built cancellation smoke returned exit 1 with status `stopped`, reason `Run canceled before task execution.`, and preserved stopped-run artifact paths.
- Cost accounting tests verified worker-pool token totals, runtime actual-cost stopping, stopped-run token/cost JSON, ledger totals, and final-report totals.
- Built actual-cost cap smoke returned exit 1 after one mocked OpenRouter call with status `stopped`, total cost `$0.04`, and total tokens `18`.
- Patch application tests verified default no-apply behavior, CLI flag opt-in, config opt-in, `patch-application.json`, ledger events, final-report metadata, and safe refusal for conflict states.
- Built clean-patch application smoke applied a mocked worktree change to the main checkout only when `--apply-clean-patches` was present.
- File ownership tests verified edit-task ownership metadata, conflict detection, `plan_created` ledger metadata, and pre-worker blocking for overlapping edit scopes.
- Built file-ownership block smoke returned exit 1 with status `blocked`, `limit` `fileOwnership`, and no worker result artifacts.
- CLI usage parsing tests verified Codex JSONL usage events, Claude JSON result usage, cost mapping, and plain-text fallback behavior.
- Built CLI usage parsing smoke mapped mocked Codex and Claude structured output into worker usage and cost totals.

## Next Best Task

Add contributor issue templates and release-readiness examples.

Expected slice:

- Add GitHub issue templates for bug reports, feature requests, and task proposals.
- Add a short release-readiness checklist for contributors.
- Keep public docs aligned with the current CLI surface.

## Human Decisions Needed

- Confirm the MIT license is acceptable for public release.
- Decide when to add issue templates and contribution labels.
