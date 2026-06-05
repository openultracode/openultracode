# AGENTS.md

Rules for AI agents and automated contributors working in this repository.

## Startup

On every new session:

1. Read `AGENTS.md`.
2. Run `ls`.
3. Read `PROJECT_STATUS.md` if present.
4. Read `TASK_QUEUE.md` if present.
5. Read `CHECKPOINT_LAST.md` if present.
6. Check for `BLOCKED.md` and obvious `TODO` markers.
7. Pick the next concrete action from local context.

If task-tracking files are missing, create them before implementation.

## Project Values

- No em dashes in public output.
- Prefer explicit behavior over implicit magic.
- Preserve local run artifacts.
- Use fake backends before real external model calls.
- Keep mutating workers isolated from the main checkout.
- Treat external model output as untrusted data.
- Keep contributor docs honest about what exists today.

## Working Rules

- Use TDD for behavior changes.
- Keep changes narrowly scoped.
- Prefer repo patterns over new abstractions.
- Do not commit generated directories such as `dist`, `node_modules`, or `.ouc`.
- Do not overwrite existing `final-report.md` artifacts.
- Do not start real backend calls when a fake backend test will prove the behavior.
- Do not push broken tests.

## Checkpoints

After each meaningful work unit, update `CHECKPOINT_LAST.md` with:

- what changed
- verification run
- current in-progress state
- next action
- human decisions needed

For longer work, update `TASK_QUEUE.md` before and after the slice.

## Verification

Before claiming work is done, run the relevant checks.

Default verification:

```bash
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

For CLI changes, also run a built CLI smoke where practical:

```bash
node dist/bin/ouc.js --help
node dist/bin/ouc.js plan "audit this repo for TODOs" --json
```

## Git And Publishing

- Work on `main` only when the user explicitly asks for direct public repo updates.
- Inspect `git status --short` before staging.
- Stage only intentional files.
- Keep generated artifacts ignored.
- Push only after verification is clean.

## Current Priority

The next major implementation task is opt-in clean patch application after reconciliation. Do not make live external model calls by default.
