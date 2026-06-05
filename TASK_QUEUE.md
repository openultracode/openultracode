# Task Queue

## Open

- Decide package license for public release if MIT default should change.
- Expand router fallback chains for real backend failure modes.
- Implement richer orchestrator plan parsing beyond deterministic local heuristics.
- Implement fake-backend run orchestration before external model calls.
- Implement worker execution backends.
- Implement worktree reconciliation and reporting.

## In-Progress

- None.

## Done

- Captured the CodexUltraCode project plan in `PLAN.md`.
- Approved `PLAN.md` for initial implementation.
- [Codex] Drafted Phase 1 TypeScript CLI foundation with tests, build config, runtime package output, README, and MIT license draft.
- [Codex] Added deterministic repo inspection, `cuc plan`, `cuc status`, and `cuc report` for local run artifacts.
- [Codex] Completed artifact persistence for local runs: `ledger.jsonl`, `final-report.md`, and status artifact presence lines.
- [Codex] Split deterministic edit goals into edit and dependent test tasks with strong model routing.
- [Codex] Refined deterministic edit task source scopes to prefer implementation files over docs and tracker files.
- [Codex] Made `cuc report` preserve an existing `final-report.md` instead of overwriting worker-authored output.
- [Codex] Added `cuc status <run-id> --json` for machine-readable local run state.
- [Codex] Added `cuc plan "<goal>" --json` for machine-readable plan creation output.
- [Codex] Added `cuc plan` validation for missing `--run-id` values.
- [Codex] Published the verified source to public GitHub repo `https://github.com/AryaVora621/openultracode`.
