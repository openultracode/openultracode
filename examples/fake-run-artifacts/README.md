# Fake-Run Artifact Examples

This directory contains a package-shipped fake backend run example. It is static, sanitized, and safe to inspect without a local `.ouc` directory or any external model calls.

## Contents

`run_fake_docs/` mirrors the important files from a successful one-task fake run:

- `plan.json`: deterministic plan shape with fake backend routing.
- `ledger.jsonl`: append-only event stream for the run.
- `final-report.md`: human-readable run summary.
- `workers/task_1/response.md`: raw fake backend response text.
- `workers/task_1/result.json`: structured worker result with usage and cost.
- `workers/task_1/changed-files.json`: clean reconciliation changed-file list.
- `workers/task_1/reconciliation.json`: clean reconciliation metadata.

Generated local runs may also include empty `diff.patch` files and `worktrees/` directories. They are omitted here because the checked example focuses on compact parseable records.

## Refresh Rules

- Keep every JSON file parseable.
- Keep every JSONL line parseable as one event.
- Keep examples free of private prompts, API keys, absolute local paths, and live provider output.
- Use fake backend output only.
- Update `tests/fake-run-artifacts.test.ts` when this shape changes.
