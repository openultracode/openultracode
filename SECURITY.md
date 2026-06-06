# Security Policy

OpenUltraCode is an early local CLI project. Security reports are welcome, especially when they help keep local repos, run artifacts, and model credentials safe.

## Supported Versions

The `main` branch is the only supported line until the project has tagged releases.

## Report Privately

Use GitHub Security Advisories:

https://github.com/openultracode/openultracode/security/advisories/new

Do not open a public issue or pull request for:

- API keys, tokens, or `.env` exposure.
- Unsafe command execution or shell injection.
- Live backend calls that happen without explicit opt-in.
- Worker patch application that can mutate the main checkout unexpectedly.
- Local run artifacts that expose private repository content.

## Include

- The affected command, file, or artifact path.
- The expected behavior and observed behavior.
- A minimal reproduction that does not include secrets.
- Whether the issue requires a live external backend.

## Project Expectations

- Fake or mocked backends should prove fixes before live model calls.
- Generated folders such as `.ouc`, `dist`, and `node_modules` should stay out of commits.
- `.env` must stay ignored and local-only.
- Existing `.ouc/runs/<run-id>/final-report.md` artifacts must not be overwritten.
