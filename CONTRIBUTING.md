# Contributing

OpenUltraCode is early. The best contributions are small, tested slices that make the local CLI more real without skipping safety.

## Start Here

1. Read `README.md`.
2. Read `PROJECT_STATUS.md`.
3. Read `docs/ARCHITECTURE.md`.
4. Read `TASK_QUEUE.md`.
5. Check `docs/RELEASE_CHECKLIST.md` if the change affects packaging or release readiness.
6. Check `docs/LOCAL_INSTALL.md` if the change affects installation or packaging.
7. Check `docs/MODEL_ROUTING.md` if the change affects planning, routing, model tiers, or backend safety.
8. Check `examples/README.md` if the change affects local config or backend routing examples.
9. Check `docs/RUN_EXAMPLES.md` if the change affects command examples or run artifact workflows.
10. Check `docs/COMPLETION_AUDIT.md` when evaluating release completeness.
11. Check `docs/RELEASE_DECISIONS.md` before release or package work.
12. Check `docs/PUBLISHING.md` before tagging, package-smoke, or npm publish work.
13. Pick one narrow behavior.
14. Write the test first for behavior changes.
15. Run the full verification commands before opening a PR.

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
- Extend integration fixtures for conflict and stopped-run scenarios.
- Improve docs around routing and safety.
- Improve module docs and artifact schema examples.

Planner heuristic fixtures live in `tests/fixtures/planner/`. Extend those fixtures when changing deterministic task decomposition.

CLI integration fixtures live in `tests/fixtures/integration/`. Extend those fixtures when changing git-backed patch application behavior.

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
