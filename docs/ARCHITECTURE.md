# Architecture

OpenUltraCode is a local-first CLI. The core design keeps planning, execution, reconciliation, and reporting as separate steps so each run can be audited after the fact.

## Runtime Flow

1. `bin/ouc.ts` starts the CLI and wires cancellation through an `AbortController`.
2. `src/cli.ts` parses commands, loads config, validates options, and owns top-level command output.
3. `src/config.ts` merges defaults with `.ouc/config.json` when present.
4. `src/repo-inspector.ts` scans the current checkout for project signals that help planning.
5. `src/planner.ts` turns a goal into scoped tasks, dependency order, model tiers, and file ownership metadata.
6. `src/router.ts` maps planned tasks to free, cheap, strong, or critical model tiers.
7. `src/worker-pool.ts` executes tasks in dependency order, tracks totals, enforces runtime cost caps, and preserves stopped-run state.
8. Backend modules return worker results without deciding how artifacts should be written.
9. `src/worktree-reconciler.ts` captures worker diffs, changed files, conflict status, and optional patch application metadata.
10. `src/run-artifacts.ts` writes plans, ledgers, worker files, reports, and machine-readable run state under `.ouc/runs/<run-id>/`.

## Module Map

| Path | Responsibility |
| --- | --- |
| `bin/ouc.ts` | CLI entrypoint and process signal handling. |
| `src/cli.ts` | Command parsing, command orchestration, JSON and text output. |
| `src/config.ts` | Typed configuration schema, defaults, and local config loading. |
| `src/repo-inspector.ts` | Lightweight repository inspection for planner inputs. |
| `src/planner.ts` | Deterministic task decomposition, dependencies, routing hints, and file ownership. |
| `src/router.ts` | Model-tier assignment based on task risk and type. |
| `src/worker-pool.ts` | Task execution order, backend calls, cancellation, token totals, and cost totals. |
| `src/backends/fake.ts` | Deterministic fake backend for safe local runs and tests. |
| `src/backends/openrouter.ts` | Explicit OpenRouter backend, env-key loading, request mapping, and usage mapping. |
| `src/backends/cli-command.ts` | Explicit Codex CLI and Claude CLI backends plus structured usage parsing. |
| `src/worktree-reconciler.ts` | Isolated worktree diff capture, conflict classification, and opt-in patch application. |
| `src/file-ownership.ts` | Edit-task ownership analysis and overlap blocking. |
| `src/run-artifacts.ts` | Artifact paths and persistence helpers. |
| `src/signal-handler.ts` | Reusable `SIGINT` and `SIGTERM` handling helpers. |
| `src/types.ts` | Shared runtime types. |

## Artifact Contract

Each run is stored under `.ouc/runs/<run-id>/`. Generated artifacts are intentionally local and ignored by git.

Important files:

- `plan.json`: the goal, planned tasks, dependency graph, routing, estimates, and ownership metadata.
- `ledger.jsonl`: append-only run and task events.
- `workers/<task-id>/response.md`: backend response body.
- `workers/<task-id>/result.json`: structured worker result, usage totals, cost totals, and backend attempts.
- `workers/<task-id>/diff.patch`: captured diff from an isolated worker checkout when available.
- `workers/<task-id>/changed-files.json`: changed-file list for reconciliation.
- `workers/<task-id>/reconciliation.json`: clean, changed, skipped, failed, or conflict reconciliation state.
- `workers/<task-id>/patch-application.json`: opt-in patch application state.
- `worktrees/<task-id>/`: isolated git worktree for mutating tasks.
- `final-report.md`: human-readable execution and reconciliation summary.

## Backend Boundaries

Backends produce task results. They do not decide whether patches are applied to the main checkout.

Current backend modes:

- `fake`: deterministic, local, safe default for tests and demos.
- `openrouter`: explicit opt-in with `OPENROUTER_API_KEY`; tests use mocked HTTP only.
- `codex-cli`: explicit opt-in through `codex exec`.
- `claude-cli`: explicit opt-in through `claude -p`.

New backends should implement the existing worker-result shape, include attempt metadata when retrying, and keep live external calls behind explicit backend selection.

## Safety Model

OpenUltraCode is designed around visible and reversible work:

- Generated run state stays under `.ouc/`.
- Secret configuration stays in ignored local env files.
- Fake workers are the safe default.
- Real backends require explicit `--backend` selection.
- Mutating edit tasks use isolated worktrees in git repos.
- Overlapping edit ownership blocks before workers run.
- Clean patch application requires `--apply-clean-patches` or `patchApplication.applyCleanPatches`.
- Existing `final-report.md` files are preserved instead of overwritten.
- `SIGINT` and `SIGTERM` preserve stopped-run artifacts.

## Extension Points

Good contribution areas:

- Planner heuristics in `src/planner.ts`.
- Repo signal detection in `src/repo-inspector.ts`.
- Model-tier policies in `src/router.ts`.
- Backend adapters under `src/backends/`.
- Worker-pool scheduling and richer resume behavior in `src/worker-pool.ts`.
- Reconciliation and conflict explanations in `src/worktree-reconciler.ts`.
- Artifact schema tests around `plan.json`, `ledger.jsonl`, and `result.json`.

Use `tests/` as the contract for expected behavior. Add tests before changing planner, backend, reconciliation, or artifact behavior.

## Release Constraints

The source is collaborator-ready after local verification, but final release still waits on:

- Human confirmation that MIT is acceptable for public package release.
- GitHub account billing unlock so the CI matrix can run remotely.
