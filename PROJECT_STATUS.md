# Project Status

Last updated: 2026-06-05 21:18 EDT

Public repo: https://github.com/AryaVora621/openultracode

## Current State

OpenUltraCode is an early local CLI foundation. Fake workers remain the safe default, external backends are explicit opt-in, local config is strictly validated before artifacts are created, edit tasks in git repos get ownership checks, isolated worktree and reconciliation artifacts, clean patch application is explicit opt-in, local CLI structured usage is parsed when available, cancellation preserves stopped-run artifacts, worker result accounting drives token and cost totals, fixture-backed planner heuristic coverage and git patch integration fixtures are present, contributor issue templates plus a PR template, architecture guide, code of conduct, local install guide, model routing guide, run examples guide, publishing guide, release checklist, completion audit, and copy-ready config examples are present, issue-template labels exist on GitHub, GitHub repo discovery metadata is set, a security policy directs private reports, Dependabot is configured, and the final release audit plus release decision record are recorded.

Implemented:

- TypeScript Node package.
- npm package name `openultracode`.
- CLI aliases `ouc` and `openultracode`.
- Config loading and strict validation with zod, including unknown-key rejection and file-aware errors.
- CLI plan/run config failures print to stderr and stop before run artifacts are created.
- Local run artifact layout.
- Repo inspection.
- Deterministic dry-run planning.
- Mixed implementation, test, and docs task decomposition.
- Documentation-only goals scoped to contributor docs.
- Fixture-backed planner heuristic tests under `tests/fixtures/planner/`.
- Git-backed clean patch application fixture under `tests/fixtures/integration/`.
- Edit-task file ownership metadata and overlap detection in plan artifacts.
- Model-tier routing.
- `ouc plan`, `ouc run`, `ouc status`, and `ouc report`.
- JSON output for `plan`, `run`, and `status`.
- `ledger.jsonl` creation during planning.
- Task-level `ledger.jsonl` events during fake runs.
- Worker response and result artifacts for fake runs.
- `final-report.md` creation, execution summaries, and preservation.
- Fake backend class for deterministic execution and tests.
- Refusal to overwrite an existing final report during `ouc run`.
- Preflight `limits.maxTasks` and `limits.maxCostUsd` enforcement for fake runs.
- Blocked-run JSON, ledger, and final report artifacts for limit stops.
- `--stop-after-task` stopped-run reporting for fake runs.
- Partial-run final reports that show succeeded, remaining, and not-run tasks.
- Worker-pool sequencing module behind fake runs.
- OpenRouter backend module with `OPENROUTER_API_KEY` env loading, request headers, response mapping, and mocked fetch tests.
- Opt-in `ouc run --backend openrouter` execution wiring, covered with mocked CLI tests.
- OpenRouter model fallback attempts for failed worker results.
- Worker `result.json` artifacts preserve backend attempt history.
- Codex CLI backend using `codex exec` in read-only sandbox mode.
- Claude CLI backend using `claude -p` with plan permissions.
- Codex CLI JSONL usage parsing when structured events are available.
- Claude CLI JSON usage parsing when structured results are available.
- Heuristic token counting fallback for plain-text CLI output.
- Pre-execution blocking for overlapping edit file ownership.
- File ownership metadata in `plan_created` ledger events.
- Isolated git worktree creation for edit tasks.
- Worker `diff.patch`, `changed-files.json`, and `reconciliation.json` artifacts.
- Final-report reconciliation sections for clean, changed, skipped, failed, and conflict states.
- Conflict classification with `git apply --check`.
- Opt-in `--apply-clean-patches` flag for applying clean changed worker patches.
- Opt-in `patchApplication.applyCleanPatches` config switch.
- Worker `patch-application.json` artifacts for applied, skipped, and failed application states.
- Patch application ledger events and final-report sections.
- Real `SIGINT` and `SIGTERM` cancellation through an `AbortController`.
- Worker-pool cancellation before execution and between tasks.
- Canceled CLI runs preserve stopped-run ledger and final report artifacts.
- Worker-pool `totalTokens` and `totalCostUsd` aggregation from actual worker results.
- Run JSON, run ledgers, and final reports include token and cost totals.
- Runtime `limits.maxCostUsd` enforcement from actual backend result costs.
- GitHub issue templates for bugs, feature requests, and scoped task proposals.
- GitHub labels used by issue templates verified in the public repo.
- GitHub pull request template for verification and safety checks.
- Code of conduct for public contributor spaces.
- Security policy for private reports through GitHub Security Advisories.
- Dependabot config for weekly npm and GitHub Actions update PRs.
- Dev dependency updates from Dependabot PRs `#1` and `#2` folded into `main`: `typescript` `^6.0.3` and `@types/node` `^25.9.2`.
- Dependabot PRs `#1` and `#2` closed as superseded by commit `e09c016`.
- GitHub Actions CI for tests, typecheck, build, and package dry-run on Node 20, 22, and 24, including manual workflow dispatch.
- Release-readiness checklist in `docs/RELEASE_CHECKLIST.md`.
- Local install guide in `docs/LOCAL_INSTALL.md`.
- Model routing and backend safety guide in `docs/MODEL_ROUTING.md`.
- Copy-ready run examples guide in `docs/RUN_EXAMPLES.md`.
- Package publishing guide in `docs/PUBLISHING.md`.
- Release decision record in `docs/RELEASE_DECISIONS.md`.
- Architecture guide in `docs/ARCHITECTURE.md` covering runtime flow, module boundaries, artifact contracts, safety model, and extension points.
- Completion audit in `docs/COMPLETION_AUDIT.md` mapping the active objective to concrete artifacts and blockers.
- Copy-ready config examples in `examples/` for safe fake, local CLI, and OpenRouter budget profiles.
- Release audit in `docs/RELEASE_AUDIT.md`.
- Changelog in `CHANGELOG.md`.
- Package file allowlist includes `docs/` so README-linked release docs ship in the package tarball.
- Package file allowlist includes `examples/`.
- Package file allowlist includes `CODE_OF_CONDUCT.md`.
- npm discovery metadata in `package.json`: repository, homepage, bugs URL, and keywords.
- Public GitHub repo discovery metadata: description, README homepage, and topics matching the package keywords.
- npm publish dry-run compatible bin metadata for `ouc` and `openultracode`.
- Test suite covering current behavior.

Not implemented yet:

- Human license decision before package release.
- Remote CI execution is blocked by a GitHub account billing lock, confirmed again on run `27048514566` and documented in `BLOCKED.md`.

## Verification Snapshot

Latest verified commands:

```bash
npm test
npm run typecheck
npm run build
npm pack --dry-run
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "workflow yaml ok"'
# repo secret-prefix scan excluding .env, node_modules, dist, .ouc, and .git
rg -n '\x{2014}|\x{2013}' . -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
git diff --check
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_budget_success --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_stopped --stop-after-task 1 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_pool_success --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_pool_stopped --stop-after-task 1 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_openrouter_wiring_fake --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_fallback_chains_fake --json
node dist/bin/ouc.js plan "implement report command, add tests, and update README docs" --run-id run_smoke_planner_docs_20260605_1729 --json
node dist/bin/ouc.js plan "update README docs" --run-id run_smoke_docs_only_20260605_1729 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_cli_backends_fake_20260605_1736 --json
node dist/bin/ouc.js run "inspect this repo" --backend codex-cli --run-id run_smoke_codex_cli_parser_20260605_1736 --stop-after-task 0 --json
node dist/bin/ouc.js run "inspect this repo" --backend claude-cli --run-id run_smoke_claude_cli_parser_20260605_1736 --stop-after-task 0 --json
node dist/bin/ouc.js run "implement report command and test it" --backend fake --run-id run_smoke_worktree_reconcile_20260605_1746 --json
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built cancellation smoke */'
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built actual-cost cap smoke */'
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built clean-patch application smoke */'
node --input-type=module -e 'import { runCli } from "./dist/src/cli.js"; /* built file-ownership block smoke */'
node --input-type=module -e 'import { CodexCliBackend, ClaudeCliBackend } from "./dist/src/backends/cli-command.js"; /* built CLI usage parsing smoke */'
```

Latest known result:

- 15 test files passed.
- 65 tests passed.
- Config tests passed with `npm test -- tests/config.test.ts`: 1 file and 5 tests.
- CLI tests passed with `npm test -- tests/cli.test.ts`: 1 file and 26 tests.
- Planner fixture tests passed with `npm test -- tests/planner-fixtures.test.ts`: 1 file and 3 tests.
- CLI integration tests passed with `npm test -- tests/cli.test.ts`: 1 file and 26 tests.
- Typecheck passed.
- Build passed.
- Package dry-run passed for `openultracode@0.1.0`, 33 files, package size `38.3 kB`.
- `npm publish --dry-run` passed with examples, run examples, and publishing docs included in the 33-file tarball and no bin metadata correction.
- GitHub workflow YAML parsed successfully.
- Model routing docs commit `a6c2ebc5eb999afa53ac53568e682522ddfbdf45` was pushed to `origin/main`.
- Publishing guide commit `ac1f1f7b1a4e2e8a6ecf1a62a4a2d13c86bd324f` was pushed to `origin/main` with CI skipped because the GitHub billing lock remains documented.
- Integration fixture coverage commit `017578210fd077f2ec4c5991831d24527ede159c` was pushed to `origin/main`.
- Config validation hardening commit `7fd249d0651dfad7ba946c4122ab390e863c8e17` was pushed to `origin/main`.
- GitHub Actions run `27048514566` for that commit failed before Node 20, 22, and 24 jobs started because the GitHub account is locked due to a billing issue.
- Repo secret-prefix scan excluding `.env` had no matches.
- Em dash scan had no matches.
- `git diff --check` reported no whitespace errors.
- Built CLI success smoke passed with `node dist/bin/ouc.js run ... --backend fake --json`.
- Completion audit fake-run smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_completion_fake_20260605_1924 --json`.
- Completion audit plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_completion_audit_20260605_1924 --json`.
- Release decision package smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_release_decisions_final_fake_20260605_1928 --json`.
- Release decision plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_release_decisions_final_20260605_1928 --json`.
- Manual dispatch package smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_release_dispatch_fake_20260605_1929 --json`.
- Manual dispatch plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_release_dispatch_20260605_1929 --json`.
- Metadata package smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_metadata_changelog_fake_20260605_1934 --json`.
- Metadata plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_metadata_changelog_20260605_1934 --json`.
- Packaged install smoke passed from a clean temporary consumer project with `npm install <tarball>`, packaged `ouc --help`, and packaged `ouc plan --json`.
- `npm publish --dry-run` passed without package bin auto-correction after normalizing bin paths to `dist/bin/ouc.js`.
- Packaged install smoke after the bin fix passed from a clean temporary consumer project with packaged `ouc --help`, packaged `openultracode --help`, and packaged `ouc plan --json`.
- `gh repo view AryaVora621/openultracode --json nameWithOwner,description,homepageUrl,repositoryTopics,visibility,viewerPermission` confirmed the public repo description, README homepage, and eight discovery topics are set.
- `docs/ARCHITECTURE.md` is linked from `README.md` and `CONTRIBUTING.md`.
- `npm pack --dry-run` confirmed `docs/ARCHITECTURE.md` ships in the package tarball.
- `CODE_OF_CONDUCT.md` is linked from `README.md` and `CONTRIBUTING.md`.
- `npm pack --dry-run` confirmed `CODE_OF_CONDUCT.md` ships in the package tarball.
- `gh api repos/AryaVora621/openultracode/community/profile` reports `health_percentage` `100` and recognizes `CODE_OF_CONDUCT.md`.
- `docs/COMPLETION_AUDIT.md` records the prompt-to-artifact checklist and the two remaining blockers.
- `npm pack --dry-run` confirmed `docs/COMPLETION_AUDIT.md` ships in the package tarball.
- `examples/README.md` documents copy-ready config examples.
- `docs/LOCAL_INSTALL.md` documents source checkout, `npm link`, package tarball smoke, and release boundaries.
- `npm pack --dry-run` confirmed `docs/LOCAL_INSTALL.md` ships in the package tarball.
- `npm publish --dry-run` confirmed the 33-file tarball with local install docs, model routing docs, run examples, and publishing docs.
- `docs/MODEL_ROUTING.md` documents tier rules, fallback behavior, backend selection, config examples, and safety controls.
- `docs/RUN_EXAMPLES.md` documents copy-ready plan, fake run, stopped run, config, local CLI, OpenRouter opt-in, model override, patch application, and troubleshooting examples.
- Run examples plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_examples_docs_20260605_2036 --json`.
- Run examples fake-run smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_examples_fake_20260605_2036 --json`.
- `docs/PUBLISHING.md` documents release modes, package smoke, release notes, tagging, npm publish, and stop conditions.
- Publishing guide plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_publishing_final_20260605_2028 --json`.
- Publishing guide fake-run smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_publishing_final_fake_20260605_2028 --json`.
- `tests/config.test.ts` verifies every JSON example loads through the real config parser.
- `tests/package.test.ts` verifies `examples` is included in the package file allowlist.
- `npm publish --dry-run` confirmed examples remain in the current 33-file tarball.
- Model routing docs smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_model_routing_docs_20260605_2015 --json`.
- Model routing fake-run smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_model_routing_fake_20260605_2015 --json`.
- Planner fixture plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_planner_fixtures_final2_20260605_2051 --json`.
- Planner fixture fake-run smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_planner_fixtures_final2_fake_20260605_2051 --json`.
- Integration fixture plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_integration_fixture_20260605_2100 --json`.
- Integration fixture fake-run smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_integration_fixture_fake_20260605_2100 --json`.
- Config validation plan smoke passed with `node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id run_config_validation_20260605_2113 --json`.
- Config validation fake-run smoke passed with `node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id run_config_validation_fake_20260605_2113 --json`.
- Built bad-config smoke against a temporary fixture returned exit 1 with file-aware stderr, empty stdout, and no run artifacts.
- Built CLI blocked-run smoke against a temporary fixture returned status `blocked` with exit 1 when `limits.maxTasks` was exceeded.
- Built CLI stopped-run smoke returned status `stopped`, succeeded 1 task, and left 1 task remaining.
- Built CLI success and stopped smokes passed through the worker-pool path.
- OpenRouter backend tests used mocked fetch only and made no live API calls.
- OpenRouter CLI wiring tests used mocked fetch only and made no live API calls.
- OpenRouter fallback tests used mocked fetch only and verified failed attempt preservation.
- Built CLI mixed planner smoke returned 3 tasks with a `$0.03` estimate.
- Built CLI docs-only planner smoke returned 1 task with a `$0.01` estimate.
- Codex CLI backend tests used mocked command runners only and made no real worker calls.
- Claude CLI backend tests used mocked command runners only and made no real worker calls.
- Built CLI fake run still succeeded after CLI backend wiring.
- Built CLI Codex and Claude backend parser smokes stopped before task execution and made no real worker calls.
- Worktree reconciliation tests verified isolated git worktree command mapping, diff artifact capture, and conflict classification.
- Built CLI worktree reconciliation smoke wrote edit-task `reconciliation.json`, empty `diff.patch`, skipped test-task reconciliation, and a final-report reconciliation section.
- Cancellation tests verified worker-pool aborts, CLI stopped artifacts, signal handler cleanup, and abort-signal propagation into CLI command backends.
- Built cancellation smoke returned exit 1 with status `stopped`, reason `Run canceled before task execution.`, and preserved stopped-run artifact paths.
- Cost accounting tests verified worker-pool token totals, runtime actual-cost stopping, stopped-run token/cost JSON, ledger totals, and final-report totals.
- Built actual-cost cap smoke returned exit 1 after one mocked OpenRouter call with status `stopped`, total cost `$0.04`, and total tokens `18`.
- Patch application tests verified default no-apply behavior, CLI flag opt-in, config opt-in, `patch-application.json`, ledger events, final-report metadata, and safe refusal for conflict states.
- Built clean-patch application smoke applied a mocked worktree change to the main checkout only when `--apply-clean-patches` was present.
- File ownership tests verified edit-task ownership metadata, conflict detection, `plan_created` ledger metadata, and pre-worker blocking for overlapping edit scopes.
- Built file-ownership block smoke returned exit 1 with status `blocked`, `limit` `fileOwnership`, and no worker result artifacts.
- CLI usage parsing tests verified Codex JSONL usage events, Claude JSON result usage, cost mapping, and plain-text fallback behavior.
- Built CLI usage parsing smoke mapped mocked Codex and Claude structured output into worker usage and cost totals.
- GitHub Actions run `27045180433` created the Node 20, 22, and 24 jobs, but each job failed before starting because the GitHub account is locked due to a billing issue.
- `gh label list --repo AryaVora621/openultracode --limit 100` showed the labels referenced by issue templates exist: `bug`, `enhancement`, and `good first issue`.
- `.github/PULL_REQUEST_TEMPLATE.md` now asks contributors for exact verification results, CLI smoke output when relevant, and safety checks for secrets, live backends, generated folders, and final-report preservation.
- `SECURITY.md` directs sensitive reports to GitHub Security Advisories and names project-specific safety areas.
- `.github/dependabot.yml` configures weekly update checks for npm dependencies and GitHub Actions.
- Dependabot PR `#1` updates `typescript` from `5.9.3` to `6.0.3`; isolated local verification passed `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npm pack --dry-run`.
- Dependabot PR `#2` updates `@types/node` from `24.13.0` to `25.9.2`; isolated local verification passed `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npm pack --dry-run`.
- Remote CI runs `27044654614` and `27044658334` for Dependabot PRs `#1` and `#2` failed before job startup because the GitHub account is locked due to a billing issue.
- Combined dev dependency update on `main` passed `npm test`, `npm run typecheck`, `npm run build`, and `npm pack --dry-run`.
- Dependabot PRs `#1` and `#2` were closed as superseded after the combined update was pushed to `main`.

## Next Best Task

Resolve the public release license decision.

Expected slice:

- Confirm MIT is acceptable for public release, or choose a replacement.
- Update `LICENSE`, `package.json`, and public docs if the license changes.
- Resolve the GitHub account billing lock and rerun CI.
- Tag or publish only after these decisions are complete.

## Human Decisions Needed

- Confirm the MIT license is acceptable for public release.
- Resolve the GitHub account billing lock so remote CI can run.
