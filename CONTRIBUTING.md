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
8. Check `docs/BACKENDS.md` if the change affects backend modules, worker results, CLI adapters, or reconciliation boundaries.
9. Check `docs/CONTRIBUTOR_STARTER_MAP.md` to choose a narrow lane and matching test surface.
10. Check `examples/README.md` if the change affects local config or backend routing examples.
11. Check `examples/fake-run-artifacts/README.md` if the change affects package-safe fake-run examples.
12. Check `docs/RUN_EXAMPLES.md` if the change affects command examples or run artifact workflows.
13. Check `docs/ARTIFACTS.md` if the change affects run files, ledgers, reports, reconciliation, or patch application artifacts.
14. Check `docs/COMPLETION_AUDIT.md` when evaluating release completeness.
15. Check `docs/RELEASE_DECISIONS.md` before release or package work.
16. Check `docs/PUBLISHING.md` before tagging, package-smoke, or npm publish work.
17. Pick one narrow behavior.
18. Write the test first for behavior changes.
19. Run the full verification commands before opening a PR.

## Development Setup

```bash
npm install
npm run verify
```

## Good First Contributions

No scoped good-first code or docs tasks are currently open. Check `TASK_QUEUE.md` for the current release blockers before starting new work, then use `docs/CONTRIBUTOR_STARTER_MAP.md` to shape a focused issue proposal.

Planner heuristic fixtures live in `tests/fixtures/planner/`. Extend those fixtures when changing deterministic task decomposition.

CLI integration fixtures live in `tests/fixtures/integration/`. Extend those fixtures when changing git-backed patch application, stopped-run, or file-ownership behavior.

Package-safe fake-backend artifact examples live in `examples/fake-run-artifacts/`. Extend those examples when changing fake-run artifact shapes.

Config examples live in `examples/`. Keep each JSON file parseable through `tests/config.test.ts`, and keep provider-specific safety notes aligned with `docs/MODEL_ROUTING.md`.

Issue templates are available for bugs, feature requests, and scoped task proposals. Pull requests use `.github/PULL_REQUEST_TEMPLATE.md` so verification and safety checks stay visible in review.

Project conduct expectations are documented in `CODE_OF_CONDUCT.md`.

Security reports and secret exposure should use `SECURITY.md`, not public issues.

## Before You Submit

Run:

```bash
npm run verify
```

The GitHub CI workflow runs the same verification gate on pushes, pull requests, and manual workflow dispatch.

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
