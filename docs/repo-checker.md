# Repo checker

Reviewers can run a check on a project's GitHub repo from two places:

- the project page at `/dashboard/reviewer/<id>` (uses the project's repo, description and hours)
- `/dashboard/reviewer/check` (paste any public GitHub URL)

The checker is advisory. It never approves or rejects anything. It points reviewers at what to look at.

## What it checks

Strict rules, no AI needed:

- **Repository**: empty or near-empty repos, forks, committed `node_modules` / build folders, committed secrets
- **History**: single-commit uploads, a first commit that holds most of the project, drag-and-drop uploads, all work on one day, claimed hours that don't fit the commit timeline
- **Hardware**: KiCad PCB and schematic files (and what's inside them: empty boards, unrouted boards, missing board outline, unwired schematics), BOM present and not empty, Gerbers, CAD source vs. export-only, suspiciously tiny CAD files, photos of the build
- **Software**: very little code, no recognisable project files
- **Docs**: README missing, thin or still a template, README covers the build for hardware, aviation theme is mentioned
- **Originality**: mostly third-party code, untouched forks, the same repo submitted by another project, the same first commit as another checked repo (needs Redis)

An optional AI read-through (Hack Club AI) gives a short summary and up to three concerns. It only runs when the rules didn't already find serious problems, and it never changes the score.

Score is 100 minus 18 per fail and 7 per warning.

## Environment variables

| Variable | Needed? | What it does |
| --- | --- | --- |
| `HACKCLUB_AI_KEY` | optional | Turns on the AI read-through. Make a key at https://ai.hackclub.com/dashboard |
| `HACKCLUB_AI_MODEL` | optional | Defaults to `qwen/qwen3-32b` |
| `GITHUB_TOKEN` | recommended | Raises GitHub's limit from 60 to 5,000 requests per hour. A token with no scopes is enough for public repos. |

Each check uses about 8 to 12 GitHub requests. Reviewers are limited to 30 checks per hour.
Redis (already used by the app) stores the last result per project and powers the duplicate checks; the checker still works without it.

## Tests

The rules are tested offline, with no network or keys:

```
npx tsx scripts/test-checker.ts
```
