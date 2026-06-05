# Build Draft

Timestamp: 2026-06-05 13:32 EDT

GitHub: https://github.com/AryaVora621/openultracode

## Current Draft Scope

Phase 1 foundation is implemented as a local TypeScript CLI package.
The current draft also includes the first bounded Phase 2 local-artifact commands.

Included:

- `package.json` with `cuc` and `codexultracode` binary aliases.
- TypeScript build and typecheck configuration.
- Vitest test setup.
- Typed config loading with safe defaults and zod validation.
- Local run artifact directory helper for `.codexultracode/runs/<run-id>/`.
- Initial task classification and model routing.
- Deterministic fake backend for worker tests.
- CLI help entry point and built bin wrapper.
- README and MIT license draft using the default plan recommendation.
- Deterministic repo inspection that ignores generated folders.
- `cuc plan "<goal>"` dry-run command that writes `.codexultracode/runs/<run-id>/plan.json`.
- `cuc status <run-id>` command that summarizes the local plan artifact.
- `cuc report <run-id>` command that prints a markdown summary for planned runs.
- `ledger.jsonl` creation during `cuc plan`.
- `final-report.md` persistence during `cuc report`, while preserving existing final reports.
- Deterministic edit-goal splitting into edit and dependent test tasks.
- Edit task source scopes prefer implementation files over docs and tracker files.
- JSON output modes for `cuc plan ... --json` and `cuc status <run-id> --json`.
- `cuc plan` rejects `--run-id` when the value is missing.

## Verification Evidence

Commands run on 2026-06-05:

```bash
npm test
npm run typecheck
npm run build
node dist/bin/cuc.js --help
node dist/bin/cuc.js plan "audit this repo for TODOs" --run-id run_smoke_20260605_1312
node dist/bin/cuc.js status run_smoke_20260605_1312
node dist/bin/cuc.js report run_smoke_20260605_1312
node dist/bin/cuc.js plan "implement JSON output and test it" --run-id run_smoke_planjson_20260605_1329 --json
node dist/bin/cuc.js status run_smoke_artifacts_20260605_1322 --json
npm pack --dry-run
```

Observed results:

- `npm test`: 8 test files, 19 tests passed.
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0.
- `node dist/bin/cuc.js --help`: printed the CLI help with `plan`, `run`, `status`, and `report`.
- `node dist/bin/cuc.js plan "audit this repo for TODOs" --run-id run_smoke_20260605_1312`: wrote `.codexultracode/runs/run_smoke_20260605_1312/plan.json`.
- `node dist/bin/cuc.js status run_smoke_20260605_1312`: printed run id, goal, one planned task, and `$0.00` estimate.
- `node dist/bin/cuc.js report run_smoke_20260605_1312`: printed a markdown run summary and noted no worker execution has run yet.
- `node dist/bin/cuc.js plan "implement JSON output and test it" --run-id run_smoke_planjson_20260605_1329 --json`: printed run id, goal, two-task count, cost estimate, plan path, and ledger path as JSON.
- `node dist/bin/cuc.js status run_smoke_artifacts_20260605_1322 --json`: printed machine-readable local run state with ledger and final report presence.
- `cuc plan` argument validation rejects a missing `--run-id` value.
- `npm pack --dry-run`: package includes 12 runtime files, including `LICENSE`, `README.md`, `dist/bin/cuc.js`, runtime `dist/src` files, and `package.json`.

## Next Step

Continue Phase 2 by implementing real backend execution behind the existing plan artifacts, starting with fake-backend run orchestration before external model calls.
