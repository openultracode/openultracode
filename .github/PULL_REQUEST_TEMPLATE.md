# Pull Request

## Summary

-

## Scope

- [ ] Behavior change
- [ ] Tests
- [ ] Documentation
- [ ] Release or packaging
- [ ] Other:

## Verification

Paste exact commands and results.

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm pack --dry-run`
- [ ] CLI smoke, if the CLI changed:

```bash
node dist/bin/ouc.js --help
node dist/bin/ouc.js plan "audit this repo for TODOs" --json
```

## Safety Checks

- [ ] I did not include API keys, tokens, private repo content, or local `.env` values.
- [ ] I used fake or mocked backends unless a live external call was explicitly approved.
- [ ] I did not commit generated folders such as `.ouc`, `dist`, or `node_modules`.
- [ ] I preserved existing `.ouc/runs/<run-id>/final-report.md` artifacts.

## Notes For Reviewers

Call out known limits, follow-up work, or release blockers here.
