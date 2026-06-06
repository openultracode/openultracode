# Contributor Starter Map

This map helps new contributors find a narrow slice without guessing where the current codebase keeps the matching behavior, tests, and docs.

OpenUltraCode is early and should stay easy to audit. The best first contribution is one lane, one behavior, one focused test, and one short docs update when user-facing behavior changes.

## Contribution Lanes

| Lane | Good first slice | Primary code | Primary tests | Docs to check |
| --- | --- | --- | --- | --- |
| Planner heuristics | Add one deterministic planning case for a specific repo shape | `src/planner.ts`, `src/repo-inspector.ts`, `src/router.ts` | `tests/planner-fixtures.test.ts`, `tests/planner.test.ts` | `docs/ARCHITECTURE.md`, `docs/MODEL_ROUTING.md` |
| Backend adapters | Improve one result mapping, error message, or usage parsing edge | `src/backends/`, `src/worker-pool.ts` | `tests/backends.test.ts`, `tests/cli.test.ts` | `docs/BACKENDS.md`, `docs/MODEL_ROUTING.md` |
| Run artifacts | Add or clarify one field in plans, ledgers, worker outputs, or reports | `src/artifacts.ts`, `src/reporter.ts`, `src/worker-pool.ts` | `tests/cli.test.ts`, `tests/fake-run-artifacts.test.ts` | `docs/ARTIFACTS.md`, `examples/fake-run-artifacts/README.md` |
| Safety controls | Tighten one preflight, validation, limit, or opt-in rule | `src/config.ts`, `src/cli.ts`, `src/file-ownership.ts` | `tests/config.test.ts`, `tests/cli.test.ts` | `docs/RUN_EXAMPLES.md`, `docs/MODEL_ROUTING.md`, `SECURITY.md` |
| Contributor docs | Make one setup, release, or troubleshooting path easier to follow | `README.md`, `CONTRIBUTING.md`, `docs/`, `examples/` | `tests/docs.test.ts`, `tests/package.test.ts` | `docs/RELEASE_DECISIONS.md`, `docs/PUBLISHING.md` |

## Starter Task Shape

A scoped task should be small enough that review can answer these questions quickly:

- What exact command or artifact changes?
- What test fails before the change?
- What local command proves the change after implementation?
- Does this require a real model call, a billing action, a tag, or npm publish?
- Does this touch `.env`, `.ouc`, `dist`, `node_modules`, or generated run output?

If the answer needs a live external backend, use a mock or fake backend first. Live OpenRouter, Codex CLI, and Claude CLI runs are explicit opt-in paths and should not be required for ordinary tests.

## Ready-To-Propose Ideas

These ideas are deliberately framed as issue proposals, not promised roadmap commitments:

- Add a fixture for a small package that has source, tests, and docs in separate folders.
- Add one CLI smoke test around an existing error path that currently only has unit coverage.
- Add one artifact example when a new ledger or worker result field is introduced.
- Clarify one troubleshooting case in `docs/RUN_EXAMPLES.md` after reproducing it locally.
- Add one backend usage parsing fixture for a structured CLI output shape.

## Review Bar

Before opening a pull request:

```bash
npm run verify
```

For CLI behavior, include the exact command you ran. For docs or package-surface changes, make sure the affected file is linked from an entrypoint and included in the package when appropriate.
