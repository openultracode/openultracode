# Changelog

All notable OpenUltraCode changes are recorded here.

## 0.1.0 Release Candidate

Status: source-ready after local verification. Final package release is still blocked on MIT license confirmation and the GitHub account billing lock for remote CI.

### Added

- TypeScript Node CLI package with `ouc` and `openultracode` binaries.
- Local config loading and validation.
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

### Changed

- Project identity, package name, binary names, docs, and local artifact directory were standardized around OpenUltraCode and `ouc`.
- Dev dependency toolchain was updated to `typescript` `^6.0.3` and `@types/node` `^25.9.2`.
- Package allowlist now includes `docs/` and `CHANGELOG.md` so README-linked release materials ship with package dry runs.

### Verification

Latest local release gate:

- `npm test`: 14 files, 59 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm pack --dry-run`: passed.
- Built CLI `--help`, `plan --json`, and fake `run --json` smokes passed.
- Secret-prefix scan excluding `.env` found no matches.
- Shell history/session secret scan found no matches.
- Public-doc dash scan found no matches.
- `.env` remains ignored and owner-only.

### Known Blockers

- Confirm MIT is acceptable for public/package release, or choose a replacement license.
- Resolve the GitHub account billing lock, then rerun CI through manual workflow dispatch.
