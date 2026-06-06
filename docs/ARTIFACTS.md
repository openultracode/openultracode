# Artifact Reference

OpenUltraCode stores each run under `.ouc/runs/<run-id>/`. The directory is local, git-ignored, and meant to be safe to attach to issues after removing any private backend text you do not want to share.

Use this guide when changing artifact writers, reviewing a run, or proposing schema changes.

## Run Directory

```text
.ouc/runs/<run-id>/
  plan.json
  ledger.jsonl
  final-report.md
  workers/
    <task-id>/
      response.md
      result.json
      diff.patch
      changed-files.json
      reconciliation.json
      patch-application.json
  worktrees/
    <task-id>/
```

Not every file is present for every run. Plan-only runs write `plan.json` and `ledger.jsonl`; `ouc report` can add `final-report.md`. Worker artifacts appear after `ouc run`.

## plan.json

`plan.json` is the source of truth for a planned run.

Important fields:

- `runId`: local run identifier.
- `goal`: user goal passed to `ouc plan` or `ouc run`.
- `createdAt`: ISO timestamp.
- `repo`: inspected repository summary.
- `tasks`: ordered task list with id, title, intent, importance, dependencies, file scope, and model tier.
- `routes`: backend and model route selected for each task.
- `fileOwnership`: edit-task ownership metadata used before worker execution.
- `estimatedCostUsd`: deterministic preflight estimate.

`ouc status` and `ouc report` read this file. If it is missing, they report the run as not found. If it is malformed, they return exit code `1` with a controlled stderr message.

## ledger.jsonl

`ledger.jsonl` is append-only JSON Lines. Every line is one event object.

Current event names:

| Event | When it appears |
| --- | --- |
| `plan_created` | After a plan is written. |
| `task_started` | Before a worker task starts. |
| `task_reconciled` | After reconciliation metadata is captured. |
| `patch_applied` | After a clean patch is applied to the main checkout. |
| `patch_skipped` | When patch application is intentionally skipped. |
| `patch_failed` | When patch application fails. |
| `task_finished` | After a worker result is written. |
| `run_finished` | After all tasks complete. |
| `run_stopped` | After cancellation, stop-after-task, or actual cost cap stopping. |
| `run_blocked` | Before workers run when a preflight limit blocks the run. |

Use the ledger to reconstruct what happened without trusting only the final report.

## Worker Artifacts

Each worker task can write files under `workers/<task-id>/`.

### response.md

Raw backend response text. Fake backend responses are deterministic. Real backend responses may contain model output that should be treated as untrusted data.

### result.json

Structured worker result:

- `taskId`
- `status`
- `response`
- `usage.inputTokens`
- `usage.outputTokens`
- `usage.totalTokens`
- `costUsd`
- `error`
- `attempts`

OpenRouter fallback attempts and local CLI usage parsing are preserved here when available.

### diff.patch

Captured git diff from the isolated worker checkout. Empty diffs are valid and mean the worker did not modify tracked files.

### changed-files.json

List of files changed by the worker checkout. This is used for reconciliation and patch application decisions.

### reconciliation.json

Reconciliation state for the worker:

- `clean`: no tracked changes.
- `changed`: diff and changed-file metadata were captured.
- `skipped`: reconciliation did not apply to the task or repo state.
- `failed`: reconciliation failed while inspecting worker output.
- `conflict`: the captured patch does not apply cleanly to the main checkout.

### patch-application.json

Written only when patch application is evaluated. Clean patch application is opt-in through `--apply-clean-patches` or `patchApplication.applyCleanPatches`.

Possible states:

- `applied`: patch applied to the main checkout.
- `skipped`: patch was not safe or not requested.
- `failed`: patch application was attempted and failed.

## final-report.md

`final-report.md` is the human-readable run summary. It includes task status, token and cost totals, reconciliation results, patch application results, and stopped or blocked reasons when relevant.

OpenUltraCode preserves an existing `final-report.md` instead of overwriting it. Use a new `--run-id` when you need a fresh report.

## JSON Examples

These examples are intentionally compact. They show the shape of package-safe fake-backend artifacts without private prompts, secrets, or live provider output.

### plan.json Example

```json
{
  "runId": "run_docs_example",
  "goal": "document artifact schemas",
  "createdAt": "2026-06-05T21:45:00.000Z",
  "repo": {
    "projectRoot": "/workspace/openultracode",
    "hasGit": true,
    "packageManager": "npm",
    "files": [
      "README.md",
      "src/cli.ts",
      "tests/cli.test.ts"
    ],
    "summary": {
      "fileCount": 3,
      "languageHints": [
        "typescript"
      ],
      "hasTests": true
    }
  },
  "tasks": [
    {
      "id": "task_1",
      "title": "Document: document artifact schemas",
      "intent": "edit",
      "importance": "normal",
      "modelTier": "free",
      "fileScope": [
        "README.md"
      ],
      "dependsOn": [],
      "instructions": "Goal: document artifact schemas\nUpdate contributor-facing documentation for the requested behavior."
    }
  ],
  "routes": {
    "task_1": {
      "tier": "free",
      "primary": {
        "backend": "fake",
        "model": "fake-model"
      },
      "fallbacks": []
    }
  },
  "fileOwnership": {
    "hasConflicts": false,
    "files": [
      {
        "path": "README.md",
        "ownerTaskIds": [
          "task_1"
        ],
        "conflict": false
      }
    ],
    "conflicts": []
  },
  "estimatedCostUsd": 0,
  "notes": [
    "Deterministic local dry-run plan. Real orchestrator parsing is not wired yet."
  ]
}
```

### ledger.jsonl Example

```jsonl
{"event":"plan_created","runId":"run_docs_example","createdAt":"2026-06-05T21:45:00.000Z","taskCount":1,"fileOwnership":{"hasConflicts":false,"files":[{"path":"README.md","ownerTaskIds":["task_1"],"conflict":false}],"conflicts":[]},"estimatedCostUsd":0}
{"event":"task_started","runId":"run_docs_example","taskId":"task_1","modelTier":"free","startedAt":"2026-06-05T21:45:01.000Z"}
{"event":"task_finished","runId":"run_docs_example","taskId":"task_1","status":"succeeded","attemptCount":1,"totalTokens":42,"costUsd":0,"finishedAt":"2026-06-05T21:45:02.000Z"}
{"event":"run_finished","runId":"run_docs_example","backend":"fake","status":"succeeded","taskCount":1,"succeeded":1,"failed":0,"totalCostUsd":0,"totalTokens":42,"finishedAt":"2026-06-05T21:45:02.000Z"}
```

### result.json Example

```json
{
  "taskId": "task_1",
  "status": "succeeded",
  "response": "Fake backend fake-model completed task_1.",
  "usage": {
    "inputTokens": 17,
    "outputTokens": 25,
    "totalTokens": 42
  },
  "costUsd": 0
}
```

## Contributor Rules

When changing artifact behavior:

- Add or update focused tests before changing writers.
- Keep generated artifacts under `.ouc/`.
- Keep artifact formats stable unless the change is documented here.
- Do not include secrets in checked-in examples.
- Prefer fake backend fixtures for artifact examples.
- Update `docs/RUN_EXAMPLES.md` when command usage changes.
