# Contributing

Thanks for improving Makuake Gadget Weekly Scout.

## Development

```bash
npm install
npm run dev:3001
```

## Quality Checks

Run these before opening a pull request:

```bash
npm run typecheck
npm run build
```

## Scraper Changes

Changes that affect Makuake access should preserve the project's conservative
access policy:

- keep user confirmation before network access;
- keep a daily fetch limit;
- prefer cache reuse;
- avoid background polling or aggressive retry loops;
- document selector changes and failure modes.

## Pull Requests

Good pull requests should include:

- a focused description of the problem;
- screenshots for UI changes;
- notes on data migration or cache compatibility when SQLite shape changes;
- verification commands that were run.

