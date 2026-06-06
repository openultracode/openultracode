# Contributing

OpenUltraCode is early. The best contributions are small, tested slices that make the local CLI more real without skipping safety.

## Start Here

1. Read `README.md`.
2. Read `PROJECT_STATUS.md`.
3. Read `docs/ARCHITECTURE.md`.
4. Read `TASK_QUEUE.md`.
5. Check `docs/RELEASE_CHECKLIST.md` if the change affects packaging or release readiness.
6. Check `examples/README.md` if the change affects local config or backend routing examples.
7. Check `docs/COMPLETION_AUDIT.md` when evaluating release completeness.
8. Check `docs/RELEASE_DECISIONS.md` before release or package work.
9. Pick one narrow behavior.
10. Write the test first for behavior changes.
11. Run the full verification commands before opening a PR.

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
- Improve module docs and artifact schema examples.

Issue templates are available for bugs, feature requests, and scoped task proposals. Pull requests use `.github/PULL_REQUEST_TEMPLATE.md` so verification and safety checks stay visible in review.

Project conduct expectations are documented in `CODE_OF_CONDUCT.md`.

Security reports and secret exposure should use `SECURITY.md`, not public issues.

## Before You Submit

Run:

```bash
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

The GitHub CI workflow runs these core checks on pushes, pull requests, and manual workflow dispatch.

If your change touches the CLI, include the command you used for a smoke test.

Before opening the PR, fill out the template with exact command results and note any release blocker that remains.

Dependabot is configured for weekly npm and GitHub Actions update PRs. Treat those PRs like any other change: review the diff and require the full verification gate before merge.

## Design Principles

- Local-first behavior.
- Inspectable artifacts.
- Fake backends before real model calls.
- Cost and task limits before scale.
- Isolated worktrees before mutating edits.
- Clear failure states over hidden recovery.
