# Security Policy

## Supported Versions

The current `main` branch is supported.

## Reporting a Vulnerability

Please open a GitHub security advisory or contact the maintainer privately if
the issue involves credentials, local data exposure, unsafe scraping behavior,
or generated-content abuse.

## Local Data

The app stores runtime cache and notes in:

```text
.codex-app-server/makuake-scout.sqlite
```

This file may contain project notes and should not be committed.

## External Access

Makuake access should remain explicit, user-approved, rate-limited, and cached.
Do not introduce background fetches, hidden polling, or unbounded crawling.

