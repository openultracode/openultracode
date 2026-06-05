# CodexUltraCode

CodexUltraCode is a local TypeScript CLI for Ultracode-style parallel coding with adaptive model routing across CLI and API backends.

V1 is intentionally scoped as a local CLI. The current implementation is Phase 1 foundation work: package scaffolding, CLI aliases, typed config loading, local run artifact paths, initial routing rules, and a deterministic fake backend for tests.

## Commands

```bash
npm install
npm test
npm run typecheck
npm run build
node dist/bin/cuc.js --help
node dist/bin/cuc.js plan "audit this repo for TODOs"
node dist/bin/cuc.js plan "implement a small change and test it" --json
node dist/bin/cuc.js status <run-id>
node dist/bin/cuc.js status <run-id> --json
node dist/bin/cuc.js report <run-id>
```

The package exposes both binary aliases after build:

- `cuc`
- `codexultracode`

## Project State

See `PLAN.md` for the full implementation plan and `TASK_QUEUE.md` for the current work queue.
