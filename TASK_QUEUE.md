# Task Queue

## Open

- Decide package license for public release if MIT default should change.

## In-Progress

- None.

## Done

- Captured the OpenUltraCode project plan in `PLAN.md`.
- Approved `PLAN.md` for initial implementation.
- [Codex] Drafted Phase 1 TypeScript CLI foundation with tests, build config, runtime package output, README, and MIT license draft.
- [Codex] Added deterministic repo inspection, `ouc plan`, `ouc status`, and `ouc report` for local run artifacts.
- [Codex] Completed artifact persistence for local runs: `ledger.jsonl`, `final-report.md`, and status artifact presence lines.
- [Codex] Split deterministic edit goals into edit and dependent test tasks with strong model routing.
- [Codex] Refined deterministic edit task source scopes to prefer implementation files over docs and tracker files.
- [Codex] Made `ouc report` preserve an existing `final-report.md` instead of overwriting worker-authored output.
- [Codex] Added `ouc status <run-id> --json` for machine-readable local run state.
- [Codex] Added `ouc plan "<goal>" --json` for machine-readable plan creation output.
- [Codex] Added `ouc plan` validation for missing `--run-id` values.
- [Codex] Published the verified source to public GitHub repo `https://github.com/AryaVora621/openultracode`.
- [Codex] Renamed the package, CLI alias, artifact directory, docs, and bin file around `ouc` and OpenUltraCode.
- [Codex] Implemented fake-backend `ouc run` orchestration with worker artifacts, task ledger events, final reports, and overwrite protection.
- [Codex] Added preflight budget and max-task enforcement for fake runs with blocked JSON, ledger, and report artifacts.
- [Codex] Added stopped-run reporting for fake runs with `--stop-after-task`, partial reports, and `run_stopped` ledger events.
- [Codex] Extracted worker-pool sequencing behind fake runs with unit coverage and unchanged CLI artifacts.
- [Codex] Added OpenRouter backend configuration and mocked tests without live API calls or committed secrets.
- [Codex] Wired OpenRouter into `ouc run` behind explicit `--backend openrouter` with mocked CLI tests and no default live calls.
- [Codex] Added OpenRouter model fallback attempts with preserved attempt history in worker results.
- [Codex] Implemented richer deterministic planner decomposition for mixed code/test/docs goals and docs-only goals.
- [Codex] Implemented explicit Codex CLI and Claude CLI worker backends with mocked tests and non-mutating command modes.
- [Codex] Implemented isolated edit-task worktrees, diff capture, reconciliation artifacts, conflict classification, and report summaries.
- [Codex] Implemented real cancellation and signal handling with stopped-run artifact preservation.
- [Codex] Implemented runtime token and cost accounting with actual-cost cap stopping.
- [Codex] Implemented opt-in clean patch application after reconciliation.
- [Codex] Implemented file ownership enforcement for overlapping worker scopes.
- [Codex] Added provider-specific usage parsing for local CLI backends when structured usage is available.
- [Codex] Added contributor issue templates and release-readiness examples.
- [Codex] Performed a final release-readiness audit and recorded the remaining license blocker.
