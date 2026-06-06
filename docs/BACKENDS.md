# Backend Modules

OpenUltraCode keeps backend execution separate from artifact writing, reconciliation, and patch application. This guide is for contributors changing `src/backends/`, `src/worker-pool.ts`, or `src/worktree-reconciler.ts`.

## Worker Backend Contract

Backend modules return a `WorkerResult` for one planned task.

Core fields:

- `taskId`: task id from `plan.json`.
- `status`: `succeeded` or `failed`.
- `response`: worker text to write into `workers/<task-id>/response.md`.
- `usage.inputTokens`, `usage.outputTokens`, `usage.totalTokens`: token accounting used by run totals.
- `costUsd`: backend-reported or estimated cost.
- `error`: failure message for failed results.
- `attempts`: optional ordered fallback attempt history.

Backends do not write run artifacts. `src/worker-pool.ts` writes `response.md` and `result.json`, emits task ledger events, and passes task workspaces to reconciliation.

## Fake Backend

`src/backends/fake.ts` is the safe default for local demos, tests, and docs.

Behavior:

- Deterministic response text from task title and instructions.
- Simple word-count token estimates.
- Zero cost.
- No network, shell, or file mutations.

Use fake backend coverage before adding or changing real backend behavior.

## OpenRouter Backend

`src/backends/openrouter.ts` is explicit opt-in through `--backend openrouter` and `OPENROUTER_API_KEY`.

Behavior:

- Reads the key from the environment through `OpenRouterBackend.fromEnv`.
- Sends chat-completions requests to the OpenRouter endpoint.
- Maps assistant content into `response`.
- Maps `usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`, and `usage.cost` into worker accounting.
- Returns failed worker results for non-OK responses, missing content, malformed JSON, or request errors.

Tests for this module use mocked fetch implementations. Do not add live network calls to the normal test suite.

## CLI Backends

`src/backends/cli-command.ts` wraps local Codex and Claude CLIs behind explicit backend flags.

Codex behavior:

- Runs `codex exec`.
- Passes the selected model with `--model`.
- Uses the task workspace as `--cd`.
- Requests read-only sandboxing and `--ask-for-approval never`.
- Requests JSON output for structured usage parsing.

Claude behavior:

- Runs `claude -p`.
- Passes the selected model with `--model`.
- Uses `--permission-mode plan`.
- Requests JSON output and disables session persistence.

Both CLI backends:

- Pass task instructions through stdin.
- Convert nonzero exits into failed worker results.
- Parse structured usage and cost when available.
- Fall back to heuristic token counts for plain text output.
- Accept an abort signal from the worker pool.
- Use mocked command runners in tests.

Current CLI prompts ask workers to return text and not edit files directly. Reconciliation still runs for edit tasks so future mutating workers, custom runners, or changed backend behavior have a stable artifact path.

## Reconciliation Boundary

`src/worktree-reconciler.ts` owns worktree setup, diff capture, conflict classification, and opt-in patch application.

Flow:

1. `prepareTaskWorkspace` creates an isolated git worktree for edit tasks in git repos.
2. `captureTaskReconciliation` writes `diff.patch`, `changed-files.json`, and `reconciliation.json`.
3. `git apply --check` classifies changed patches as clean or conflict.
4. `applyCleanPatch` writes `patch-application.json` and applies only changed, clean patches when the user opted in.

Reconciliation statuses:

- `clean`: worktree exists and has no tracked changes.
- `changed`: a patch and changed-file list were captured.
- `skipped`: reconciliation does not apply to the task or repo.
- `failed`: git inspection failed.
- `conflict`: captured patch does not apply cleanly to the main checkout.

Patch application statuses:

- `applied`: clean patch applied to the main checkout.
- `skipped`: patch application was not requested or was unsafe.
- `failed`: patch application was attempted and failed.

Keep this boundary intact: backend modules should not decide whether a patch is safe to apply.

## Test Expectations

When changing backend modules:

- Add focused unit tests for backend result mapping.
- Use mocked fetch or command runners for real backend adapters.
- Run `npm run verify`.
- Add a fake backend smoke when command behavior changes.
- Update `docs/ARTIFACTS.md` if result, reconciliation, ledger, or patch artifact fields change.
