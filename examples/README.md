# Examples

These files are copy-ready starting points for `.ouc/config.json`.

Use them like this:

```bash
mkdir -p .ouc
cp examples/config.safe-fake.json .ouc/config.json
npm run build
node dist/bin/ouc.js run "inspect this repo" --backend fake --json
```

## Files

- `config.safe-fake.json`: routes every tier to the deterministic fake backend. Use this for local demos, tests, and contributor onboarding without external model calls.
- `config.local-cli.json`: routes work through local Codex and Claude CLI backends. Use this only after those CLIs are installed and authenticated locally.
- `config.openrouter-budget.json`: keeps OpenRouter enabled with a small cost cap. Use this only with `OPENROUTER_API_KEY` stored in your ignored local `.env` or shell environment.
- `config.advanced-routing.json`: mixes OpenRouter, Codex CLI, and Claude CLI tiers with a small budget and patch application disabled. Use this as a shape reference before creating your own provider profile.
- `examples/fake-run-artifacts/`: package-safe fake backend run artifacts for docs, issue examples, and parser checks.

## Safety Notes

- Do not commit `.ouc/config.json` if it contains private routing choices, local paths, or secret-adjacent settings.
- Do not put API keys in these JSON files.
- Unknown config keys are rejected, including typoed nested keys like `limits.maxWorker`.
- Keep `free.models` lists unique so fallback attempts do not repeat the same model.
- Keep `patchApplication.applyCleanPatches` set to `false` until you intentionally want clean worker patches applied to the main checkout.
- Keep `limits.maxWorkers`, `limits.maxTasks`, and `limits.maxCostUsd` conservative when mixing provider families.
- Prefer `--backend fake` when writing tests or validating docs.
