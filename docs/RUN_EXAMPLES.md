# Run Examples

These examples are copy-ready command recipes for the current CLI.

The safest path is:

1. Build locally.
2. Start with the fake backend.
3. Inspect `.ouc/runs/<run-id>/`.
4. Use real backends only when you intentionally opt in.

## Local Setup

```bash
npm install
npm run build
```

Use a predictable run ID while trying examples:

```bash
run_id="run_examples_$(date +%Y%m%d_%H%M%S)"
```

## Plan Only

Create a dry-run plan without executing workers:

```bash
node dist/bin/ouc.js plan "audit this repo for TODOs" --run-id "$run_id" --json
```

Inspect the generated artifacts:

```bash
node dist/bin/ouc.js status "$run_id"
node dist/bin/ouc.js status "$run_id" --json
node dist/bin/ouc.js report "$run_id"
```

Generated files:

```text
.ouc/runs/<run-id>/plan.json
.ouc/runs/<run-id>/ledger.jsonl
.ouc/runs/<run-id>/final-report.md
```

## Safe Fake Run

Run a complete fake execution:

```bash
run_id="fake_run_$(date +%Y%m%d_%H%M%S)"
node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id "$run_id" --json
node dist/bin/ouc.js report "$run_id"
```

Fake runs are useful for:

- Contributor onboarding.
- Verifying artifact shape.
- Checking final-report rendering.
- Exercising task routing without external model calls.

## Stopped Run

Simulate a partial run:

```bash
run_id="stopped_run_$(date +%Y%m%d_%H%M%S)"
node dist/bin/ouc.js run "implement a small change and test it" --backend fake --run-id "$run_id" --stop-after-task 1 --json
node dist/bin/ouc.js status "$run_id"
node dist/bin/ouc.js report "$run_id"
```

Expected behavior:

- The run returns `status: "stopped"`.
- Completed task artifacts remain on disk.
- Remaining tasks are listed in `final-report.md`.
- The ledger includes a stopped-run event.

## Use Safe Config Examples

Start from a package-shipped config:

```bash
mkdir -p .ouc
cp examples/config.safe-fake.json .ouc/config.json
node dist/bin/ouc.js run "inspect this repo" --backend fake --json
```

Try the local CLI routing profile only after local CLIs are installed and authenticated:

```bash
cp examples/config.local-cli.json .ouc/config.json
node dist/bin/ouc.js run "inspect this repo" --backend codex-cli --stop-after-task 0 --json
node dist/bin/ouc.js run "inspect this repo" --backend claude-cli --stop-after-task 0 --json
```

`--stop-after-task 0` is a parser and planning smoke. It does not run a real worker task.

## OpenRouter Opt-In

OpenRouter is never used by tests or fake examples. To run it intentionally:

```bash
mkdir -p .ouc
cp examples/config.openrouter-budget.json .ouc/config.json
export OPENROUTER_API_KEY="replace-with-your-local-key"
node dist/bin/ouc.js run "summarize this repo" --backend openrouter --run-id "openrouter_summary" --json
```

Do not put API keys in `.ouc/config.json`, `README.md`, shell history, or tracked docs.

If you need to scan the repo for the key marker, generate the pattern at runtime:

```bash
rg -l "$(printf 'sk-or-%s-' 'v1')" . -g '!.env' -g '!node_modules' -g '!dist' -g '!.ouc' -g '!.git'
```

## Model Override

Use `--model` to override a backend model for a single run:

```bash
node dist/bin/ouc.js run "inspect this repo" --backend fake --model fake-model --json
```

For real backends, keep overrides narrow and record them in the run notes or issue description.

## Patch Application

Clean patch application is opt-in:

```bash
node dist/bin/ouc.js run "implement a small change and test it" --backend codex-cli --apply-clean-patches --json
```

Use this only after reading the generated reconciliation artifacts:

```text
.ouc/runs/<run-id>/workers/<task-id>/diff.patch
.ouc/runs/<run-id>/workers/<task-id>/changed-files.json
.ouc/runs/<run-id>/workers/<task-id>/reconciliation.json
.ouc/runs/<run-id>/workers/<task-id>/patch-application.json
```

## Troubleshooting

If a run is blocked:

- Check `limits.maxTasks` and `limits.maxCostUsd` in `.ouc/config.json`.
- Check for strict config validation errors such as unknown keys or typoed nested keys.
- Check file ownership metadata in `.ouc/runs/<run-id>/plan.json`.
- Read `.ouc/runs/<run-id>/final-report.md`.

If a run already has a final report:

- Use a new `--run-id`.
- Do not delete existing run artifacts unless you intentionally want to remove local evidence.

If a real backend fails:

- Reproduce with `--backend fake` first.
- Verify the relevant CLI or API key outside OpenUltraCode.
- Keep failed run artifacts attached to the issue or PR.
