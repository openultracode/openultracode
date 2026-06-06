# Local Install

OpenUltraCode is source-ready for local contributor use. The npm package is not published yet because final release still waits on license confirmation and a green GitHub Actions run after the account billing lock is resolved.

## Prerequisites

- Node.js `20.18` or newer.
- npm.
- Git.
- Optional: Codex CLI for `--backend codex-cli`.
- Optional: Claude CLI for `--backend claude-cli`.
- Optional: OpenRouter API key for `--backend openrouter`.

Do not put API keys in committed files. Keep `OPENROUTER_API_KEY` in an ignored local `.env` file or in your shell environment.

## Source Checkout

```bash
git clone https://github.com/AryaVora621/openultracode.git
cd openultracode
npm install
npm test
npm run typecheck
npm run build
```

Run the built CLI directly:

```bash
node dist/bin/ouc.js --help
node dist/bin/ouc.js plan "audit this repo for TODOs" --json
node dist/bin/ouc.js run "inspect this repo" --backend fake --json
```

## Local Command Alias

For local development, use `npm link` after building:

```bash
npm run build
npm link
ouc --help
openultracode --help
```

When done testing the global link:

```bash
npm unlink -g openultracode
```

## Config Examples

Copy a safe local example before experimenting:

```bash
mkdir -p .ouc
cp examples/config.safe-fake.json .ouc/config.json
node dist/bin/ouc.js run "inspect this repo" --backend fake --json
```

Other examples:

- `examples/config.local-cli.json`: routes through local Codex and Claude CLI backends.
- `examples/config.openrouter-budget.json`: routes through OpenRouter with a small cost cap.

## Package Tarball Smoke

Before publishing, inspect and smoke-test the package tarball locally:

```bash
npm run build
npm pack --dry-run
npm publish --dry-run
```

For a clean consumer install smoke:

```bash
tmpdir=$(mktemp -d)
npm pack --pack-destination "$tmpdir"
cd "$tmpdir"
npm init -y
npm install ./openultracode-0.1.0.tgz
./node_modules/.bin/ouc --help
./node_modules/.bin/openultracode --help
./node_modules/.bin/ouc plan "audit this repo for TODOs" --json
```

Remove the temporary directory when the smoke is done.

## Release Boundary

Do not tag or publish until:

- MIT is confirmed as acceptable for public release, or the license is changed.
- GitHub Actions can run successfully after the billing lock is resolved.
- `docs/RELEASE_CHECKLIST.md` passes.
- `docs/RELEASE_DECISIONS.md` is current.
