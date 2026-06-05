# Task Queue

## Open

- Decide package license for public release if MIT default should change.
- Add cancellation and partial-run reporting for stopped fake runs.
- Expand router fallback chains for real backend failure modes.
- Implement richer orchestrator plan parsing beyond deterministic local heuristics.
- Implement worker execution backends.
- Implement worktree reconciliation and reporting.

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
