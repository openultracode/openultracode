# Release Decisions

This document records the decisions that must be explicit before tagging or publishing OpenUltraCode.

The concrete tag, package-smoke, and npm publish handoff lives in `docs/PUBLISHING.md`.

## Current Recommendation

Keep the current source release as a public collaborator-ready release candidate until the two human-owned blockers are resolved.

Recommended next release target:

- GitHub source release first, after remote CI can run.
- npm package release second, after the package license is confirmed and the same CI run is green.

## Required Human Decisions

### License

Current state:

- `LICENSE` is MIT.
- `package.json` uses `"license": "MIT"`.
- `README.md` points to `LICENSE`.

Decision needed:

- Confirm MIT is acceptable for public package release, or choose a replacement before publication.

If MIT is confirmed:

- No source changes are needed for license text.
- Record the confirmation in `PROJECT_STATUS.md` and `docs/RELEASE_AUDIT.md`.

If the license changes:

- Update `LICENSE`.
- Update `package.json`.
- Update `README.md`.
- Update `docs/RELEASE_AUDIT.md`.
- Run the full verification gate again.

### GitHub Actions Billing Lock

Current state:

- `.github/workflows/ci.yml` is configured.
- The latest checked run is `27045180433`.
- Node 20, 22, and 24 jobs were created but did not start because the GitHub account is locked due to a billing issue.

Decision or action needed:

- Resolve the GitHub account billing lock.
- Rerun the CI workflow manually through `workflow_dispatch` or push a new verified commit.
- Require a green CI run before tagging or npm publication.

### Release Channel

Current state:

- The repo is usable as source.
- `npm pack --dry-run` succeeds.
- No npm publication has been performed.

Decision needed:

- Choose whether `0.1.0` should be GitHub source only, npm package only, or both.

Recommended path:

- Use GitHub source release for early collaborator onboarding.
- Publish to npm only after CI is green on GitHub-hosted runners.

## Pre-Tag Gate

Run from the repo root after resolving the two blockers:

```bash
npm run verify
```

Run at least these built CLI smokes:

```bash
node dist/bin/ouc.js --help
node dist/bin/ouc.js plan "audit this repo for TODOs" --json
node dist/bin/ouc.js run "implement a small change and test it" --backend fake --json
```

Check local secret and generated artifact hygiene:

```bash
git check-ignore -v .env
ls -l .env
rg -l "$(printf 'sk-or-%s-' 'v1')" . -g '!.env' -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
rg -n "$(printf '\\342\\200\\224|\\342\\200\\223')" . -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
git status --short --ignored
```

Expected state:

- `.env` is ignored and owner-only.
- No API key marker appears outside `.env`.
- Generated folders are ignored.
- Public docs do not contain disallowed dash characters.
- Local and remote `main` match.
- Open pull request list is empty or intentionally triaged.
- GitHub Actions CI is green.
- Manual CI rerun is available through `workflow_dispatch`.

## Tagging And Publishing Notes

After all gates pass:

1. Create a release notes entry from `docs/RELEASE_AUDIT.md` and `PROJECT_STATUS.md`.
   The current draft release notes live in `CHANGELOG.md`.
2. Tag the confirmed source:

```bash
git tag v0.1.0
git push origin v0.1.0
```

3. For npm publication, run:

```bash
npm publish --dry-run
```

4. Publish only after confirming the dry run contents match `npm pack --dry-run`.

## Current Decision Status

| Decision | Status | Owner |
| --- | --- | --- |
| License for public release | Pending | Human |
| GitHub account billing lock | Blocked | Human |
| GitHub source release | Ready after CI | Human |
| npm package release | Ready after license and CI | Human |
