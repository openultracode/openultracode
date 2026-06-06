# Integration Fixtures

These small repositories back CLI integration tests. They are copied into
temporary directories before each test initializes git.

## Fixture Matrix

| Fixture | Purpose |
| --- | --- |
| `conflict-file-ownership-app` | Single-file project that forces overlapping edit and docs ownership. |
| `git-patch-app` | Git-backed source and test files for clean patch application runs. |
| `stopped-run-app` | Source and test files for fake runs stopped after partial execution. |

Keep fixtures small and deterministic. Do not put generated run artifacts in
this directory.
