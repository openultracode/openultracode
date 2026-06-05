# Release Checklist

Use this checklist before tagging or publishing OpenUltraCode.

## Human Decisions

- Confirm the package license for public release.
- Confirm the package version in `package.json`.
- Confirm the release target, such as GitHub source only or npm package.

## Local Verification

Run from the repo root:

```bash
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

For CLI changes, run at least one built smoke:

```bash
node dist/bin/ouc.js --help
node dist/bin/ouc.js plan "audit this repo for TODOs" --json
node dist/bin/ouc.js run "implement a small change and test it" --backend fake --json
```

## Secret And Artifact Hygiene

```bash
git check-ignore -v .env
ls -l .env
rg -l "$(printf 'sk-or-%s-' 'v1')" . -g '!.env' -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
rg -n "$(printf '\\342\\200\\224|\\342\\200\\223')" . -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
```

Expected result:

- `.env` is ignored and owner-only.
- No API key marker appears outside `.env`.
- Generated folders remain untracked or ignored.
- Public docs do not contain disallowed dash characters.

## Release Notes

Record:

- Added commands or flags.
- Changed artifact formats.
- New safety checks.
- Verification commands and results.
- Known gaps that remain open.
