# OpenUltraCode Project Plan

## Summary

Build an open-source local CLI for Ultracode-style parallel coding with adaptive model routing across Claude CLI, Codex CLI, and OpenRouter. The first version should prove that parallel agent workflows can be cheaper and more controllable than running every worker on the same premium model.

V1 is a local CLI MVP, not a daemon, dashboard, or hosted platform. The CLI should plan work, spawn isolated workers, route tasks to suitable models, record cost and usage, preserve worker artifacts, reconcile diffs, and produce a final report.

## Research Baseline

- Claude Code dynamic workflows are script-orchestrated research-preview workflows for many subagents.
- Claude Code workflow documentation describes limits of up to 16 concurrent agents and up to 1,000 agents total per workflow run.
- Ultracode combines high-effort orchestration with automatic workflow execution, but the model-routing problem is that workflow agents can inherit the expensive session model.
- OpenRouter gives the project a useful model marketplace layer: normalized chat completions, provider routing, structured outputs, tools, and usage metadata.
- Current free OpenRouter model candidates include `qwen/qwen3-coder:free`, `nvidia/nemotron-3-super-120b-a12b:free`, `nvidia/nemotron-3-ultra-550b-a55b:free`, `moonshotai/kimi-k2.6:free`, `qwen/qwen3-next-80b-a3b-instruct:free`, `openai/gpt-oss-120b:free`, and `openai/gpt-oss-20b:free`.
- Current cheap paid OpenRouter model candidates include `deepseek/deepseek-v4-flash`, `tencent/hy3-preview`, `xiaomi/mimo-v2.5`, `minimax/minimax-m2.5`, `minimax/minimax-m3`, `qwen/qwen3-coder-next`, and `openai/gpt-oss-120b`.

## Product Shape

The CLI should expose two binary names:

- `openultracode`
- `ouc`

Primary commands:

- `ouc plan "<goal>"` creates a dry-run task plan with model assignments and estimated cost.
- `ouc run "<goal>"` plans, asks for approval when configured, executes workers, reconciles outputs, and writes a final report.
- `ouc status <run-id>` prints run progress from local artifacts.
- `ouc report <run-id>` prints or opens the final run report.

The default workflow should be:

1. Inspect the target repo.
2. Ask the orchestrator to split the user goal into scoped tasks.
3. Classify each task by intent, risk, importance, context size, and expected output shape.
4. Route each task to a free, cheap, strong, or critical model tier.
5. Execute mutating tasks in isolated git worktrees.
6. Execute non-mutating tasks through API or CLI workers as appropriate.
7. Preserve worker logs, responses, diffs, and cost metadata.
8. Merge clean patches.
9. Flag conflicts or risky changes for final orchestrator review.
10. Produce a final report with what changed, what failed, cost, time, and next actions.

## Architecture

Use TypeScript on Node.js for the first implementation because process orchestration, JSON artifacts, and CLI packaging are straightforward there.

Core subsystems:

- `Orchestrator`: uses the configured top model to understand the project, split work, classify task importance, assign model tiers, and define file ownership.
- `Router`: maps task tiers to concrete providers and models from a profile, with free-first fallback behavior.
- `WorkerPool`: runs workers concurrently inside hard caps for worker count, task count, and cost.
- `Backends`: wraps `claude -p`, `codex exec`, and OpenRouter chat completions behind one interface.
- `WorktreeManager`: creates temporary git worktrees for mutating worker tasks and preserves each worker diff as an artifact.
- `Reconciler`: applies non-conflicting diffs, records conflicts, and calls review workers only when needed.
- `Ledger`: records model, provider, elapsed time, token usage, estimated cost, status, and artifacts for every task.
- `Reporter`: creates a human-readable final report and machine-readable JSON output.

## Model Routing

Ship with profiles instead of hard-coded one-model behavior.

Default profile:

- `free`: best-effort OpenRouter free workers for low-risk, parallelizable tasks.
- `cheap`: low-cost paid OpenRouter workers for fallbacks and higher reliability.
- `strong`: Codex CLI, Claude CLI, or stronger OpenRouter models for code edits and tests.
- `critical`: premium orchestrator and final reviewer models for high-risk planning, conflict resolution, and final reconciliation.

Initial free-first routing list:

```json
{
  "free": [
    "qwen/qwen3-coder:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "moonshotai/kimi-k2.6:free",
    "openai/gpt-oss-120b:free"
  ],
  "cheap": [
    "deepseek/deepseek-v4-flash",
    "xiaomi/mimo-v2.5",
    "minimax/minimax-m2.5",
    "openai/gpt-oss-120b"
  ],
  "strong": [
    "minimax/minimax-m3",
    "qwen/qwen3-coder-next",
    "deepseek/deepseek-v4-pro"
  ]
}
```

Routing rules:

- Try free models first for low and normal tasks.
- Fall back to cheap paid models on timeout, rate limit, invalid JSON, unavailable provider, or low-confidence output.
- Use strong models for mutating code work, test repair, and multi-file reasoning.
- Use critical models only for orchestration, conflict resolution, risky edits, and final review.
- Never let adaptive routing exceed user or config limits for cost, worker count, or task count.

## Safety And Isolation

- Mutating workers must run in isolated git worktrees.
- Workers must receive explicit file ownership and should not write outside their scoped worktree.
- The main checkout should not be edited directly by workers.
- Applying patches on `main` or `master` should be refused unless the user passes `--allow-main`.
- Every run should be resumable from `.ouc/runs/<run-id>/`.
- Failed, canceled, or conflicting worker outputs should remain inspectable.
- No leaked Claude Code source or unauthorized implementation material should be used.

## Public Interfaces

Example config:

```json
{
  "profiles": {
    "balanced": {
      "orchestrator": { "backend": "openrouter", "model": "anthropic/claude-opus-4.8" },
      "critical": { "backend": "claude-cli", "model": "opus" },
      "strong": { "backend": "codex-cli", "model": "gpt-5.3-codex" },
      "cheap": { "backend": "openrouter", "model": "deepseek/deepseek-v4-flash" },
      "free": { "backend": "openrouter", "models": ["qwen/qwen3-coder:free"] }
    }
  },
  "limits": {
    "maxWorkers": 16,
    "maxCostUsd": 5,
    "maxTasks": 100,
    "requirePlanApproval": true
  }
}
```

Task shape:

```ts
type Task = {
  id: string;
  title: string;
  intent: "research" | "edit" | "review" | "test" | "summarize";
  importance: "low" | "normal" | "high" | "critical";
  modelTier: "free" | "cheap" | "strong" | "critical";
  fileScope: string[];
  dependsOn: string[];
  instructions: string;
};
```

Run artifact layout:

```text
.ouc/runs/<run-id>/plan.json
.ouc/runs/<run-id>/ledger.jsonl
.ouc/runs/<run-id>/workers/<task-id>/response.md
.ouc/runs/<run-id>/workers/<task-id>/diff.patch
.ouc/runs/<run-id>/final-report.md
```

## Implementation Phases

### Phase 1: Project Foundation

- Initialize a TypeScript Node CLI package.
- Add `ouc` and `openultracode` binary aliases.
- Add config loading, typed schemas, and local run artifact directories.
- Add fake backends for deterministic tests.

### Phase 2: Planning And Routing

- Implement repo inspection.
- Implement orchestrator prompt and structured task plan parsing.
- Implement task classification and model-tier assignment.
- Implement free-first OpenRouter routing with fallback chains.

### Phase 3: Worker Execution

- Implement OpenRouter backend.
- Implement Claude CLI backend using `claude -p`.
- Implement Codex CLI backend using `codex exec`.
- Add concurrency control, cancellation, timeouts, and cost caps.

### Phase 4: Worktrees And Reconciliation

- Create isolated worker worktrees for edit tasks.
- Capture diffs per worker.
- Apply clean diffs and preserve conflicts.
- Generate final review tasks for risky or conflicting outputs.

### Phase 5: Reporting And Polish

- Add status and report commands.
- Add final report generation.
- Add documentation, examples, and a safe default config.
- Add packaging and local install instructions.

## Test Plan

Unit tests:

- Config loading applies defaults and rejects invalid profile entries.
- Router tries free models first and falls back correctly.
- Budget caps stop new tasks before exceeding configured spend.
- Task classifier assigns simple summaries to free or cheap tiers and risky edits to strong or critical tiers.
- Worktree manager creates isolated worktrees and only cleans up generated worktrees.
- Reconciler applies non-conflicting patches and reports conflicts.

Integration tests:

- Fake backends execute a multi-task run and produce `plan.json`, `ledger.jsonl`, worker artifacts, and `final-report.md`.
- A simulated free-model failure falls back to a cheap model.
- A budget stop preserves completed results and marks queued work as canceled.
- A fixture repo receives only reconciled patches in the main checkout.

Manual smoke tests:

```bash
ouc plan "audit this repo for TODOs"
ouc run "make a tiny safe edit in a fixture repo" --max-cost 1 --max-workers 4
ouc status <run-id>
ouc report <run-id>
```

## Open Decisions

- Package license, default recommendation is MIT.
- Whether `anthropic/claude-opus-4.8` should be in the default config or only shown as an example to avoid stale model naming.
- Whether V1 should include an MCP adapter after CLI MVP is working.

## Current Stop Point

The initial CLI foundation and local planning artifact commands are implemented.
See `PROJECT_STATUS.md`, `TASK_QUEUE.md`, and `CHECKPOINT_LAST.md` for the current live handoff state.
