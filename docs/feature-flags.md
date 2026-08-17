# Feature Flags Operations

Runbook for releasing and rolling back feature-flagged functionality in `apps/website`.

## Current Setup

Flag evaluation lives in:

- `apps/website/src/flags.ts`
- `apps/website/src/util/env.ts`
- `apps/website/src/server/actions/flags.ts`
- `apps/website/src/app/DeveloperToolbar.tsx`

The remaining release flag is controlled by a server env var and is **off by default** unless explicitly enabled.

## Global Release Flags

- `FF_USER_SETTINGS_ENABLED`

Developer override control:

- `FF_ALLOW_DEVELOPER_OVERRIDES`

## Decision Behavior

For the remaining release flag:

1. If `FF_*` env var is `false`: feature is disabled globally.
2. If `FF_*` env var is `true`: feature is enabled globally.
3. If developer overrides are enabled and user is developer, local cookie override may flip behavior for that developer only.

Important: developer overrides do not bypass a globally disabled `FF_*` env var.

## How To Release A Feature Globally

Example: release user settings.

1. Set `FF_USER_SETTINGS_ENABLED=true` in staging.
2. Deploy or restart the website service.
3. Validate behavior in staging.
4. Set `FF_USER_SETTINGS_ENABLED=true` in production.
5. Deploy or restart the website service.
6. Monitor errors and user feedback.

## How To Roll Back

1. Set the same env var to `false` in production.
2. Deploy or restart the website service.
3. Validate that the feature is no longer reachable.

Rollback is env-driven and does not require code changes.

## Developer Overrides

Use only for internal/debug workflows.

Requirements:

- `FF_ALLOW_DEVELOPER_OVERRIDES=true`
- user matches developer rule in `developerFlag` (`@example.com`)

When enabled, developers can use the toolbar to set per-feature cookie values (`0` or `1`) for their own session.

Recommended production setting:

- `FF_ALLOW_DEVELOPER_OVERRIDES=false`

## Recommended Environment Defaults

Production:

- `FF_USER_SETTINGS_ENABLED=false` until explicitly launched
- `FF_ALLOW_DEVELOPER_OVERRIDES=false`

Staging:

- keep `FF_USER_SETTINGS_ENABLED=false` by default, enable per test plan
- `FF_ALLOW_DEVELOPER_OVERRIDES=true` is acceptable for QA/debug

Local development:

- keep `FF_USER_SETTINGS_ENABLED=false` unless currently working on it
- `FF_ALLOW_DEVELOPER_OVERRIDES=true` by default via `ENV` fallback

## After Successful Launch

When a feature is stable and no rollback is expected:

1. Remove its flag checks in UI/server code.
2. Remove its key from `featureFlagKeys.ts` and `flags.ts`.
3. Remove related tests tied only to toggle behavior.
4. Remove unused env var from deployment config.
