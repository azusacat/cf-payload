# Pre-commit content design

## Summary

Define what happens during `git commit` in this repo (Husky + lint-staged), what it’s responsible for, and how contributors should interact with it.

## Goals

- Ensure consistent formatting and basic lint autofixes on _staged_ files before a commit is created.
- Keep the pre-commit step fast by limiting work to staged files only.
- Make the pre-commit behavior predictable and easy to run locally.

## Non-goals

- Running the full lint suite, typecheck, build, or test suites on every commit.
- Mutating files that are not staged for commit.
- Replacing CI; CI remains the source of truth for full validation.

## Current implementation

### Entry point

Husky runs a single pre-commit hook:

- `.husky/pre-commit` runs `pnpm run lint-staged --quiet`

### Staged-file tasks

`lint-staged` is configured in the root `package.json` and operates only on staged files. It applies a set of file-type rules, including (but not limited to):

- `**/package.json`: `sort-package-json`
- `*.{md,mdx,yml,json}`: `prettier --write`
- `*.{js,jsx,ts,tsx}`:
  - `eslint --flag v10_config_lookup_from_file --cache --fix`
  - `prettier --write`
- `templates/**/pnpm-lock.yaml`: `pnpm runts scripts/remove-template-lock-files.ts`
- `tsconfig.base.json`: `node scripts/reset-tsconfig.js`
- `README.md`: copy to `packages/payload/README.md` to keep published README in sync

## Developer workflow

### Normal usage

- Make changes
- Stage files
- Commit: pre-commit rewrites staged files (where applicable) to match formatting/lint rules

### Run the same checks manually

Run on your staged files:

- `pnpm run lint-staged`

### If pre-commit rewrites files

If the hook formats or fixes files, it will update the staged versions (and may also update your working tree). Review the resulting diff and proceed with the commit.

## Failure modes & mitigation

### Hook fails locally

Common causes:

- Dependencies are not installed
- Toolchain mismatch (Node / pnpm)
- A linter or formatter rule rejects the staged change

Recommended response:

- Run `pnpm install` (if needed)
- Re-run `pnpm run lint-staged` to iterate until clean

### Bypassing the hook

Bypass options exist (`git commit --no-verify`, or `HUSKY=0 git commit`), but should be used sparingly because they can create commits that will immediately fail CI or cause noisy diffs later.

## Design notes

- Keeping the hook scoped to staged files reduces latency and avoids surprising edits to unrelated files.
- Separating “commit-time hygiene” (pre-commit) from “full correctness” (CI) keeps local iteration fast without weakening validation.
