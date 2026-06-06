# Integration Fixtures

These small repositories back CLI integration tests. They are copied into
temporary directories before each test initializes git.

## Fixture Matrix

| Fixture | Purpose |
| --- | --- |
| `git-patch-app` | Git-backed source and test files for clean patch application runs. |

Keep fixtures small and deterministic. Do not put generated run artifacts in
this directory.
