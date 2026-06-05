# Contributing

OpenUltraCode is early. The best contributions are small, tested slices that make the local CLI more real without skipping safety.

## Start Here

1. Read `README.md`.
2. Read `PROJECT_STATUS.md`.
3. Read `TASK_QUEUE.md`.
4. Pick one narrow behavior.
5. Write the test first.
6. Run the full verification commands before opening a PR.

## Development Setup

```bash
npm install
npm test
npm run typecheck
npm run build
```

## Good First Contributions

- Improve `ouc plan` error messages.
- Add status/report edge-case tests.
- Add task-level ledger event schemas.
- Add fake-backend run artifacts.
- Add fixture repos for integration tests.
- Improve docs around routing and safety.

## Before You Submit

Run:

```bash
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

If your change touches the CLI, include the command you used for a smoke test.

## Design Principles

- Local-first behavior.
- Inspectable artifacts.
- Fake backends before real model calls.
- Cost and task limits before scale.
- Isolated worktrees before mutating edits.
- Clear failure states over hidden recovery.
