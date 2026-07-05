---
name: ops-digest
description: Daily operational digest across mossabid repos — open PRs, CI status, stale branches, dependency and deploy health. Use when asked for repo status, ops digest, or "what needs my attention" — also fired daily by a routine.
---

# Ops digest

## Scope

Repos: `mossabid/agentops-recruitment-workflow`, `mossabid/perf-lab`.
Use the GitHub MCP tools (`mcp__github__*`); never guess state from memory.

## Procedure

1. For each repo, collect: open PRs (age, review state, CI status via
   `pull_request_read` / `get_check_run`), open issues, branches ahead of the
   default branch older than 14 days.
2. Repo-specific checks:
   - **agentops-recruitment-workflow**: `requirements.txt` pins nothing —
     note any dependency with a known breaking major release since last digest.
   - **perf-lab**: if any shell file (`index.html`, `app.css`, `app.js`,
     `backend.js`, `sw.js`) changed on the default branch since the last
     `CACHE = "perflab-vN"` bump in `sw.js`, flag a missing cache bump
     (stale-PWA risk). Check the latest Pages deploy succeeded
     (`actions_list` on perf-lab).
3. Rank findings by "will bite soonest". Drop anything unchanged since the
   previous digest unless it crossed a threshold (e.g. PR became 7 days old).
4. Write the digest and give the top 3 items in chat. If nothing is
   actionable, say exactly that in one line — an empty digest is a valid,
   good outcome.

## Output contract

Write `reports/ops/<yyyy-mm-dd>.md`: `## Needs action`, `## Watching`,
`## All clear`. Keep yesterday's file — the diff between days is the signal.

## Telemetry

Best-effort event POST with `"skill":"ops-digest"`.
