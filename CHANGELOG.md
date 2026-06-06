# Changelog

All notable OpenUltraCode changes are recorded here.

## 0.1.0 Release Candidate

Status: source-ready after local verification. Final package release is still blocked on MIT license confirmation and the GitHub account billing lock for remote CI.

### Added

- TypeScript Node CLI package with `ouc` and `openultracode` binaries.
- Local config loading with strict validation, unknown-key rejection, and file-aware error messages.
- Repo inspection and deterministic planning.
- `ouc plan`, `ouc run`, `ouc status`, and `ouc report`.
- JSON output for plan, run, and status commands.
- Local `.ouc/runs/<run-id>/` artifact layout.
- Planning ledger creation and fake-run task ledger events.
- Fake backend execution through the worker pool.
- Preflight task and cost limit blocking.
- Stopped-run reporting through `--stop-after-task`.
- Signal cancellation handling for `SIGINT` and `SIGTERM`.
- OpenRouter backend wiring behind explicit opt-in with mocked tests.
- Codex CLI and Claude CLI backends behind explicit opt-in.
- Structured usage parsing for Codex CLI JSONL and Claude CLI JSON output.
- Heuristic token fallback for plain-text backend output.
- Runtime token and cost accounting.
- Runtime cost-cap stopping from actual backend results.
- Isolated worktree reconciliation artifacts for edit tasks.
- File ownership metadata and overlap blocking for mutating tasks.
- Opt-in clean patch application through CLI flag or config.
- Contributor issue templates, pull request template, security policy, Dependabot, release checklist, release audit, and release decision record.
- GitHub Actions CI configuration across Node 20, 22, and 24, with manual dispatch available after the account billing lock is fixed.
- Public GitHub repo description, README homepage, and discovery topics for contributor discovery.
- Architecture guide covering runtime flow, module boundaries, artifact contracts, safety model, and extension points.
- Code of conduct for public contributor spaces.
- Completion audit mapping the active objective to concrete artifacts and blockers.
- Copy-ready local config examples for fake, local CLI, and OpenRouter budget profiles.
- Local install and package tarball smoke instructions.
- Model routing and backend safety guide.
- Package publishing guide with release-note, tag, tarball, and npm handoff steps.
- Copy-ready run examples for planning, fake execution, stopped runs, local CLI smokes, OpenRouter opt-in, and patch application.
- Artifact reference guide for run directories, plans, ledgers, worker outputs, reconciliation, patch application, and final reports.
- Fixture-backed planner tests for mixed source/test/docs goals, docs-only goals, and audit routing through the real repo inspector.
- Integration fixture repo for git-backed clean patch application tests.
- Status/report malformed plan artifact handling with focused CLI coverage.

### Changed

- Project identity, package name, binary names, docs, and local artifact directory were standardized around OpenUltraCode and `ouc`.
- `ouc plan` and `ouc run` now print config validation errors to stderr and stop before creating run artifacts.
- `ouc status` and `ouc report` now print controlled stderr errors for malformed `plan.json` artifacts.
- Dev dependency toolchain was updated to `typescript` `^6.0.3` and `@types/node` `^25.9.2`.
- Package allowlist now includes `docs/` and `CHANGELOG.md` so README-linked release materials ship with package dry runs.

### Verification

Latest local release gate:

- `npm test`: 16 files, 68 tests passed.
- `npm test -- tests/docs.test.ts`: 1 file, 1 test passed.
- `npm test -- tests/planner-fixtures.test.ts`: 1 file, 3 tests passed.
- `npm test -- tests/config.test.ts`: 1 file, 5 tests passed.
- `npm test -- tests/cli.test.ts`: 1 file, 28 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm pack --dry-run`: passed with 34 files and package size `40.3 kB`.
- `npm publish --dry-run`: passed with 34 files and package size `40.3 kB`.
- Built CLI `--help`, `plan --json`, fake `run --json`, bad-config, and malformed-plan smokes passed.
- Secret-prefix scan excluding `.env` found no matches.
- Shell history/session secret scan found no matches.
- Public-doc dash scan found no matches.
- `.env` remains ignored and owner-only.

### Known Blockers

- Confirm MIT is acceptable for public/package release, or choose a replacement license.
- Resolve the GitHub account billing lock, then rerun CI through manual workflow dispatch.
