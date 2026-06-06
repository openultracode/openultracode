# Publishing

This guide describes the exact handoff for turning the current release candidate into a tagged source release or npm package.

Do not publish while either release blocker is open:

- MIT license confirmation is still pending.
- GitHub Actions jobs cannot start until the account billing lock is resolved.

## Release Modes

Use one of these modes after the blockers are resolved:

| Mode | Use when | Required gate |
| --- | --- | --- |
| Source release only | Collaborators should use GitHub checkout first | Local verification plus green GitHub CI |
| npm package only | The CLI should install from npm without a GitHub release | Local verification, green GitHub CI, package dry-run, publish dry-run |
| Source plus npm | The release should support both checkout and package install | All gates below |

The recommended `0.1.0` path is source release first, then npm after CI is green and the license is confirmed.

## Preflight

Confirm local and remote state:

```bash
git status --short --branch --ignored
git rev-parse HEAD
git rev-parse origin/main
gh pr list --repo AryaVora621/openultracode --state open --limit 20
gh run list --repo AryaVora621/openultracode --limit 5
```

Expected state:

- `main` and `origin/main` point to the same commit.
- No unexpected tracked changes are present.
- `.env`, `.ouc`, `dist`, and `node_modules` are ignored.
- Any open PR is intentionally triaged.
- The latest GitHub Actions CI run is green.

If CI is still blocked by the account billing lock, stop and update `BLOCKED.md`.

## After Billing Unlock

After the GitHub account billing lock is resolved, rerun CI on the current `main` tip before tagging or publishing:

```bash
git fetch origin
git status --short --branch --ignored
git rev-parse HEAD
git rev-parse origin/main
gh workflow run ci.yml --repo AryaVora621/openultracode --ref main
gh run list --repo AryaVora621/openultracode --limit 5
gh run watch --repo AryaVora621/openultracode
```

Inspect the completed run:

```bash
gh run view <run-id> --repo AryaVora621/openultracode
```

Expected result:

- Local `HEAD` and `origin/main` match before the rerun.
- The new workflow run is for the current `main` commit.
- Node 20, 22, and 24 verification jobs start and finish green.
- `BLOCKED.md`, `PROJECT_STATUS.md`, `docs/RELEASE_AUDIT.md`, and `docs/COMPLETION_AUDIT.md` are updated with the green run id before any tag or npm publish.

## Local Gate

Run these commands from the repo root:

```bash
npm run verify
npm publish --dry-run
```

Run built CLI smokes:

```bash
node dist/bin/ouc.js --help
node dist/bin/ouc.js plan "audit this repo for TODOs" --json
node dist/bin/ouc.js run "implement a small change and test it" --backend fake --json
```

Run hygiene checks:

```bash
git check-ignore -v .env
stat -f '%Lp %N' .env
rg -l "$(printf 'sk-or-%s-' 'v1')" . -g '!.env' -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
rg -n '\x{2014}|\x{2013}' . -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
git diff --check
```

Expected state:

- `.env` is ignored and mode `0600`.
- No OpenRouter key marker appears outside ignored `.env`.
- No disallowed dash characters appear in public docs.
- No whitespace errors are reported.

## Package Smoke

Inspect the install experience from a temporary consumer project:

```bash
tmpdir="$(mktemp -d)"
npm pack --pack-destination "$tmpdir"
cd "$tmpdir"
npm init -y
npm install ./openultracode-0.1.0.tgz
./node_modules/.bin/ouc --help
./node_modules/.bin/openultracode --help
./node_modules/.bin/ouc plan "audit this repo for TODOs" --json
```

Remove the temporary directory after recording the result.

## Package Contents

The package should include:

- `README.md`
- `LICENSE`
- `CHANGELOG.md`
- `CODE_OF_CONDUCT.md`
- `dist/`
- `docs/`
- `examples/`

It should not include:

- `.env`
- `.ouc/`
- `node_modules/`
- Local shell history.
- Any API key or real credential.

Use `npm pack --dry-run` and `npm publish --dry-run` to confirm the tarball contents before any real publish.

## Release Notes

Use this release note shape:

```markdown
## OpenUltraCode 0.1.0

OpenUltraCode is a local CLI for parallel coding agents with adaptive model routing.

Highlights:

- Deterministic planning with model-tier routing.
- Safe fake backend for local demos and tests.
- Explicit OpenRouter, Codex CLI, and Claude CLI backends.
- Isolated worktree reconciliation for mutating tasks.
- Cost and token accounting.
- Contributor docs, release checklist, security policy, and config examples.

Known blockers before package publication:

- MIT license confirmation.
- GitHub Actions account billing lock.
```

Pull verification evidence from:

- `CHANGELOG.md`
- `docs/RELEASE_AUDIT.md`
- `docs/COMPLETION_AUDIT.md`
- `PROJECT_STATUS.md`

## Tagging

Only tag after local verification passes and GitHub Actions is green:

```bash
git tag -a v0.1.0 -m "OpenUltraCode v0.1.0"
git push origin v0.1.0
```

Record the tag in `PROJECT_STATUS.md`, `docs/RELEASE_AUDIT.md`, and `CHANGELOG.md`.

## npm Publish

Only publish after:

- The license is confirmed.
- GitHub Actions CI is green.
- `npm publish --dry-run` has passed with the expected tarball contents.
- A clean temporary package install smoke has passed.

Publish command:

```bash
npm publish --access public
```

After publishing:

- Verify the npm package page shows version `0.1.0`.
- Install the published package in a clean temporary project.
- Run packaged `ouc --help`.
- Record the result in `PROJECT_STATUS.md`, `docs/RELEASE_AUDIT.md`, and `CHANGELOG.md`.

## Stop Conditions

Stop before tagging or publishing if any of these are true:

- The license is not confirmed.
- GitHub Actions cannot start or is red.
- `npm publish --dry-run` changes package metadata unexpectedly.
- A secret scan finds a key marker outside `.env`.
- The package smoke cannot run `ouc` and `openultracode`.
- Local and remote `main` do not match.
