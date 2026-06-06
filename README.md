# OpenUltraCode

OpenUltraCode is an open-source local CLI for parallel coding agents with adaptive model routing.

The goal is simple: make multi-agent coding workflows cheaper, safer, and more controllable than sending every worker to the same expensive premium model.

Today, OpenUltraCode is an early TypeScript CLI foundation. It can inspect a repo, create deterministic dry-run plans, route tasks across model tiers, execute safe fake-backend runs through a worker-pool abstraction, preserve local run artifacts, enforce file ownership for mutating tasks, capture per-worker reconciliation metadata, apply clean patches only after explicit opt-in, parse structured usage from local CLI backends when available, enforce actual cost caps, stop cleanly on cancellation, and expose status/report commands. Contributor issue templates, labels, a PR template, a security policy, Dependabot, a release checklist, and a release audit are in place.

## Why This Should Exist

Modern coding agents are powerful, but parallel agent workflows still have rough edges:

- Expensive models get used for cheap tasks.
- Worker outputs are hard to audit after a run.
- Mutating workers can step on each other.
- Cost, task routing, and artifacts are often hidden.
- Resuming a partially completed run is painful.

OpenUltraCode is built around the opposite defaults:

- Local first.
- Artifact first.
- Cost aware.
- Free and cheap model tiers where they make sense.
- Strong models only where the task actually needs them.
- Isolated worker execution before mutating the main checkout.

## What Works Now

Current implemented surface:

- TypeScript Node CLI package.
- Binary aliases:
  - `ouc`
  - `openultracode`
- Config loading with typed schemas and safe defaults.
- Local run directories under `.ouc/runs/<run-id>/`.
- Deterministic repo inspection.
- Dry-run planning with task routing.
- Plan artifacts include edit-task file ownership metadata and overlap detection.
- Edit goals split into edit and dependent test tasks.
- Mixed implementation, test, and docs goals split into dependent code, verification, and documentation tasks.
- Documentation-only goals stay scoped to README and `docs/` files.
- Source scopes prefer implementation files over docs and tracker files.
- Free-first routing with cheap fallback for low-risk tasks.
- Strong routing for edit and test tasks.
- `ledger.jsonl` creation during planning.
- `ouc run "<goal>" --backend fake` local execution.
- Task-level ledger events during fake runs.
- Worker response and result artifacts under each run directory.
- `limits.maxTasks` and `limits.maxCostUsd` preflight blocking for fake runs.
- `--stop-after-task` stopped-run reporting for fake runs.
- `run_blocked` and `run_stopped` ledger events.
- Worker-pool sequencing behind fake runs.
- OpenRouter backend module with env-key loading and mocked HTTP tests.
- Opt-in `ouc run --backend openrouter` execution wiring.
- OpenRouter model fallback attempts after failed mocked backend responses.
- Opt-in `ouc run --backend codex-cli` execution through `codex exec` in read-only sandbox mode.
- Opt-in `ouc run --backend claude-cli` execution through Claude print mode with plan permissions.
- Codex CLI JSONL usage parsing when structured events are available.
- Claude CLI JSON usage parsing when structured results are available.
- Heuristic token counting fallback when local CLIs return plain text.
- Worker result artifacts preserve backend attempt history.
- Edit tasks in git repos get isolated worktrees under the run artifact directory.
- Worker reconciliation artifacts preserve `diff.patch`, `changed-files.json`, and `reconciliation.json`.
- Final reports include a reconciliation section with clean, changed, skipped, failed, or conflict status.
- Runs block before worker execution when two edit tasks claim the same file.
- `plan_created` ledgers include file ownership metadata for auditability.
- `--apply-clean-patches` and `patchApplication.applyCleanPatches` opt in to applying clean changed patches.
- Patch application writes `patch-application.json`, ledger events, and final-report metadata.
- `SIGINT` and `SIGTERM` cancellation are converted into stopped runs that preserve partial artifacts.
- Run JSON, ledgers, and final reports include total token and cost accounting from worker results.
- Actual backend cost can stop a run before the next task when `limits.maxCostUsd` is exceeded.
- `final-report.md` creation, execution summaries, and preservation.
- Machine-readable JSON output for plan, run, and status.
- Deterministic fake backend for local execution and tests.

## Try It Locally

```bash
npm install
npm test
npm run typecheck
npm run build
```

Create a dry-run plan:

```bash
node dist/bin/ouc.js plan "audit this repo for TODOs"
```

Create a machine-readable plan:

```bash
node dist/bin/ouc.js plan "implement a small change and test it" --json
```

Run the safe fake backend:

```bash
node dist/bin/ouc.js run "implement a small change and test it" --backend fake --json
```

Simulate a stopped fake run:

```bash
node dist/bin/ouc.js run "implement a small change and test it" --backend fake --stop-after-task 1 --json
```

Run OpenRouter explicitly:

```bash
OPENROUTER_API_KEY=... node dist/bin/ouc.js run "implement a small change and test it" --backend openrouter --json
```

Run a local CLI backend explicitly:

```bash
node dist/bin/ouc.js run "inspect this repo" --backend codex-cli --json
node dist/bin/ouc.js run "inspect this repo" --backend claude-cli --json
```

Opt in to applying clean worker patches after reconciliation:

```bash
node dist/bin/ouc.js run "implement a small change and test it" --backend codex-cli --apply-clean-patches --json
```

Inspect a run:

```bash
node dist/bin/ouc.js status <run-id>
node dist/bin/ouc.js status <run-id> --json
node dist/bin/ouc.js report <run-id>
```

Before release work, use the checklist:

```bash
cat docs/RELEASE_CHECKLIST.md
```

For the current release blockers and recommended release channel, read:

```bash
cat docs/RELEASE_DECISIONS.md
```

For package publishing and release-note handoff steps, read:

```bash
cat docs/PUBLISHING.md
```

For local install, linking, and package tarball smoke instructions, read:

```bash
cat docs/LOCAL_INSTALL.md
```

For model-tier routing and backend safety rules, read:

```bash
cat docs/MODEL_ROUTING.md
```

For copy-ready run examples, read:

```bash
cat docs/RUN_EXAMPLES.md
```

For the current prompt-to-artifact completion audit, read:

```bash
cat docs/COMPLETION_AUDIT.md
```

For release notes, read:

```bash
cat CHANGELOG.md
```

For contributor conduct expectations, read:

```bash
cat CODE_OF_CONDUCT.md
```

For copy-ready local config examples, read:

```bash
cat examples/README.md
```

For the internal module map and extension points, read:

```bash
cat docs/ARCHITECTURE.md
```

Example artifact layout:

```text
.ouc/runs/<run-id>/plan.json
.ouc/runs/<run-id>/ledger.jsonl
.ouc/runs/<run-id>/workers/<task-id>/response.md
.ouc/runs/<run-id>/workers/<task-id>/result.json
.ouc/runs/<run-id>/workers/<task-id>/diff.patch
.ouc/runs/<run-id>/workers/<task-id>/changed-files.json
.ouc/runs/<run-id>/workers/<task-id>/reconciliation.json
.ouc/runs/<run-id>/workers/<task-id>/patch-application.json
.ouc/runs/<run-id>/worktrees/<task-id>/
.ouc/runs/<run-id>/final-report.md
```

## Roadmap

### Milestone 1: Local Planning Foundation

Status: mostly implemented.

- CLI package scaffold.
- Config schema and defaults.
- Repo inspection.
- Deterministic task planning.
- Mixed code, test, and docs task decomposition.
- Documentation-only planning scope.
- Model-tier routing.
- Local artifact layout.
- Status and report commands.

### Milestone 2: Fake-Backend Runs

Status: fake local execution, preflight limit blocking, stopped-run reporting, and signal cancellation are implemented.

- Implemented `ouc run` using fake workers first.
- Writes worker responses and results under run artifacts.
- Appends task-level ledger events.
- Generates final reports from completed fake runs.
- Refuses to overwrite an existing `final-report.md`.
- Stops before worker execution when `maxTasks` or `maxCostUsd` would be exceeded.
- Writes blocked ledger events and final reports for limit stops.
- Writes stopped ledger events and final reports for partial fake runs.
- Converts `SIGINT` and `SIGTERM` into stopped runs with preserved artifacts.

### Milestone 3: Real Backends

Status: OpenRouter, Codex CLI, and Claude CLI are wired behind explicit opt-in. CLI backends still use conservative command modes by default, parse structured usage when available, and patch application only acts on captured worktree diffs.

- OpenRouter chat completion backend.
- Claude CLI backend using `claude -p`.
- Codex CLI backend using `codex exec`.
- Timeout, retry, and fallback behavior.
- Provider-specific CLI usage parsing when local CLIs expose structured usage.

### Milestone 4: Safe Mutating Work

Status: isolated worktree creation, file ownership enforcement, diff capture, changed-file metadata, conflict classification, and opt-in clean patch application are implemented.

- Isolated git worktrees for edit tasks.
- Worker file ownership.
- Diff capture per worker.
- Clean patch application behind explicit CLI or config opt-in.
- Conflict reporting.

### Milestone 5: Polish And Packaging

Status: contributor issue templates, labels, PR template, security policy, Dependabot, release checklist, and release audit are implemented. Packaging polish remains open.

- Richer docs and examples.
- Better default config.
- More integration fixture scenarios.
- Contributor-friendly issue templates.
- Contributor-friendly PR template.
- Security policy for private reports.
- Weekly npm and GitHub Actions dependency update checks.
- Release-readiness checklist.
- Release decision record for license, CI, and package publication.
- Changelog for release notes.

## Architecture

OpenUltraCode is intentionally modular:

- `Orchestrator`: turns a user goal into scoped tasks.
- `Router`: maps tasks to free, cheap, strong, or critical model tiers.
- `WorkerPool`: runs tasks with concurrency, cost, and task limits.
- `Backends`: wraps OpenRouter, Claude CLI, Codex CLI, and fake workers.
- `WorktreeManager`: isolates mutating tasks.
- `Reconciler`: captures worker diffs, changed files, conflict status, and opt-in clean patch application.
- `Ledger`: records run and task events.
- `Reporter`: creates human and machine-readable outputs.

The high-level module map, runtime flow, artifact contract, backend boundaries, and extension points live in `docs/ARCHITECTURE.md`.

## Help Wanted

Useful contributions right now:

- Add conflict and stopped-run scenarios to integration fixtures.
- Harden config validation and error messages.
- Keep CI green across Node 20, 22, and 24.
- Review `docs/RELEASE_DECISIONS.md` once the license and CI blockers are resolved.

Good first issue shape:

- One command.
- One artifact behavior.
- One focused test file.
- No real external model calls.

## Safety Rules

The project should stay boring in the best way:

- Do not mutate the target repo directly from workers.
- Do not apply patches on `main` or `master` without an explicit opt-in.
- Preserve failed and partial worker artifacts.
- Keep cost caps enforceable.
- Keep local files inspectable.
- Prefer fake backends in tests.
- Treat external model output as untrusted.

## Development Workflow

```bash
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

For behavior changes, write or update the test first. The current test suite uses Vitest and covers config, routing, planning, artifacts, fake backend output, and CLI behavior.

## Project Files For Contributors

- `PLAN.md`: original product and implementation plan.
- `CHANGELOG.md`: release notes and known blockers.
- `PROJECT_STATUS.md`: current snapshot and next steps.
- `TASK_QUEUE.md`: open, active, and completed work.
- `CHECKPOINT_LAST.md`: latest handoff checkpoint.
- `BUILD_DRAFT.md`: build snapshot and verification evidence.
- `AGENTS.md`: rules for AI agents contributing to this repo.

## License

MIT. See `LICENSE`.
