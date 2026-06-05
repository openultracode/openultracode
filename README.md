# OpenUltraCode

OpenUltraCode is an open-source local CLI for parallel coding agents with adaptive model routing.

The goal is simple: make multi-agent coding workflows cheaper, safer, and more controllable than sending every worker to the same expensive premium model.

Today, OpenUltraCode is an early TypeScript CLI foundation. It can inspect a repo, create deterministic dry-run plans, route tasks across model tiers, execute safe fake-backend runs through a worker-pool abstraction, preserve local run artifacts, and expose status/report commands. The next milestone is richer orchestrator planning.

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
- Worker result artifacts preserve backend attempt history.
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

Inspect a run:

```bash
node dist/bin/ouc.js status <run-id>
node dist/bin/ouc.js status <run-id> --json
node dist/bin/ouc.js report <run-id>
```

Example artifact layout:

```text
.ouc/runs/<run-id>/plan.json
.ouc/runs/<run-id>/ledger.jsonl
.ouc/runs/<run-id>/workers/<task-id>/response.md
.ouc/runs/<run-id>/workers/<task-id>/result.json
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

Status: fake local execution, preflight limit blocking, and stopped-run reporting implemented. Real signal cancellation is still planned.

- Implemented `ouc run` using fake workers first.
- Writes worker responses and results under run artifacts.
- Appends task-level ledger events.
- Generates final reports from completed fake runs.
- Refuses to overwrite an existing `final-report.md`.
- Stops before worker execution when `maxTasks` or `maxCostUsd` would be exceeded.
- Writes blocked ledger events and final reports for limit stops.
- Writes stopped ledger events and final reports for partial fake runs.
- Add real cancellation and signal handling.

### Milestone 3: Real Backends

Status: planned.

- OpenRouter chat completion backend.
- Claude CLI backend using `claude -p`.
- Codex CLI backend using `codex exec`.
- Timeout, retry, and fallback behavior.
- Cost and token accounting.

### Milestone 4: Safe Mutating Work

Status: planned.

- Isolated git worktrees for edit tasks.
- Worker file ownership.
- Diff capture per worker.
- Clean patch application.
- Conflict reporting.

### Milestone 5: Polish And Packaging

Status: planned.

- Richer docs and examples.
- Better default config.
- Local install docs.
- More integration tests.
- Contributor-friendly issue templates.

## Architecture

OpenUltraCode is intentionally modular:

- `Orchestrator`: turns a user goal into scoped tasks.
- `Router`: maps tasks to free, cheap, strong, or critical model tiers.
- `WorkerPool`: runs tasks with concurrency, cost, and task limits.
- `Backends`: wraps OpenRouter, Claude CLI, Codex CLI, and fake workers.
- `WorktreeManager`: isolates mutating tasks.
- `Reconciler`: applies safe diffs and records conflicts.
- `Ledger`: records run and task events.
- `Reporter`: creates human and machine-readable outputs.

The implementation is not all there yet. The repo currently contains the planning foundation, local artifact flow, and fake execution harness needed to build those pieces safely.

## Help Wanted

Useful contributions right now:

- Add fixture repos that stress deterministic planning heuristics.
- Add real token and cost accounting once external backends land.
- Add real cancellation and signal handling.
- Add fixture repos for integration tests.
- Harden config validation and error messages.
- Improve docs for model routing and safety.

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
- `PROJECT_STATUS.md`: current snapshot and next steps.
- `TASK_QUEUE.md`: open, active, and completed work.
- `CHECKPOINT_LAST.md`: latest handoff checkpoint.
- `BUILD_DRAFT.md`: build snapshot and verification evidence.
- `AGENTS.md`: rules for AI agents contributing to this repo.

## License

MIT. See `LICENSE`.
