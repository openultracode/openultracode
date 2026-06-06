# Model Routing

OpenUltraCode separates task planning from backend execution. The planner assigns each task an intent, importance, model tier, file scope, and dependency list. The router then maps that tier to the active profile in `.ouc/config.json`.

## Task Classification

Current tier rules are deterministic:

| Task signal | Tier |
| --- | --- |
| `importance: "critical"` | `critical` |
| `intent: "edit"` | `strong` |
| `intent: "test"` | `strong` |
| `intent: "review"` with high importance | `strong` |
| high importance, otherwise | `cheap` |
| everything else | `free` |

Planning heuristics currently infer intent from the goal text:

- Words like `implement`, `fix`, `add`, `change`, `update`, and `write` create edit work.
- Words like `test`, `spec`, and `verify` create test work.
- Words like `review`, `audit`, and `inspect` create research work.
- Words like `summary`, `summarize`, and `explain` create summarize work.

Mixed code, test, and docs goals become dependent tasks. Documentation-only goals stay scoped to README and `docs/` files where possible.

## Default Profile

The default profile is `balanced`.

| Profile slot | Default backend | Default model |
| --- | --- | --- |
| `orchestrator` | `openrouter` | `openai/gpt-oss-120b` |
| `critical` | `claude-cli` | `opus` |
| `strong` | `codex-cli` | `gpt-5.3-codex` |
| `cheap` | `openrouter` | `deepseek/deepseek-v4-flash` |
| `free` | `openrouter` | free-model fallback list |

The defaults are intentionally conservative about mutation. Real model calls only happen when a backend is explicitly selected for `ouc run`.

## Fallbacks

The router builds fallback chains from the active profile:

- `free` tasks use the first configured free model, then the remaining free models, then the `cheap` slot.
- `cheap` tasks fall back to the `strong` slot.
- `strong` tasks fall back to the `critical` slot.
- `critical` tasks do not add an automatic stronger fallback.

OpenRouter execution also preserves attempt history in worker `result.json` artifacts when model fallback attempts happen.

## Backend Selection

`ouc plan` can show routes without executing real backends.

`ouc run` requires an explicit backend:

```bash
node dist/bin/ouc.js run "inspect this repo" --backend fake --json
node dist/bin/ouc.js run "inspect this repo" --backend codex-cli --json
node dist/bin/ouc.js run "inspect this repo" --backend claude-cli --json
OPENROUTER_API_KEY=... node dist/bin/ouc.js run "inspect this repo" --backend openrouter --json
```

Use `--model` to override the selected backend model for a single run.

## Safety Controls

Routing is only one layer. Execution also uses these safety controls:

- Fake backend remains the safest default for tests and demos.
- OpenRouter refuses to run without `OPENROUTER_API_KEY`.
- Mutating edit tasks in git repos run in isolated worktrees.
- Overlapping edit file ownership blocks before worker execution.
- Clean patch application is opt-in through `--apply-clean-patches` or `patchApplication.applyCleanPatches`.
- Runtime token and cost totals are recorded in run JSON, ledgers, and reports.
- `limits.maxCostUsd` can stop a run before the next task after real backend costs are known.
- `SIGINT` and `SIGTERM` preserve stopped-run artifacts.

## Config Examples

Start from the package-shipped examples:

- `examples/config.safe-fake.json`: routes every tier to the deterministic fake backend.
- `examples/config.local-cli.json`: routes work through local Codex and Claude CLI backends.
- `examples/config.openrouter-budget.json`: routes through OpenRouter with a small cost cap.

Copy one into `.ouc/config.json`, then run a fake backend smoke before using real backends:

```bash
mkdir -p .ouc
cp examples/config.safe-fake.json .ouc/config.json
node dist/bin/ouc.js run "inspect this repo" --backend fake --json
```

Do not put API keys in `.ouc/config.json`.

Config validation is strict. Unknown top-level keys and typoed nested keys, such as `limits.maxWorker`, fail with the config path before workers or run artifacts are created. Free-tier model lists must be unique so fallback chains do not repeat the same model.

## Contributor Notes

When changing routing behavior:

- Update `src/router.ts` or `src/planner.ts` with focused tests.
- Keep real backend tests mocked.
- Update this guide when tier rules or fallback behavior changes.
- Run `npm run verify`.
