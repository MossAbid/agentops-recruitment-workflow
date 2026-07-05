# Routines — recurring tasks on a schedule

A routine is a scheduled trigger whose prompt is just "run `/skill-name`".
All logic stays in the skill (versioned in git); the routine only owns the *when*.

**Status: enabled** (2026-07-05, fresh-session mode). Cron runs in UTC; times
below are Paris summer time (UTC+2). While the skills live only on the
`claude/agentic-os-claude-code-2nq841` branch, each routine's prompt checks out
that branch first and falls back to the default branch once it's merged.

## Catalog

| Routine | Cron (UTC) | Fires (Paris) | Trigger ID | Notify |
|---|---|---|---|---|
| `weekly-pipeline-report` | `0 6 * * 1` | Mon 08:00 | `trig_012EZvM1SxmsZB8TtnQ74VTo` | email on completion |
| `daily-ops-digest` | `30 6 * * 1-5` | weekdays 08:30 | `trig_018ipK6gzfDJ6vqUq6gUHhfs` | push, noteworthy only |
| `perflab-health` | `0 7 * * 6` | Sat 09:00 | `trig_01HJzq4Z9f7Sf26yhs1WRiSZ` | push, failures only |

`weekly-pipeline-report` runs `/pipeline-report 7d` and commits the report.
`daily-ops-digest` runs `/ops-digest`, commits, and stays quiet unless
"Needs action" is non-empty. `perflab-health` is read-only: perf-lab test
suites + Pages deploy check + `sw.js` CACHE-bump consistency.

## Rules

1. **One skill per routine.** If a routine needs two skills, it's two routines.
2. **Quiet success.** Routines write files and commit; they only notify on
   failures or "needs action" findings.
3. **Every firing is a run record.** Routine prompts inherit skill telemetry,
   so the control plane's routine calendar shows fired/succeeded/failed per day.
4. **Kill switch.** `list_triggers` → `update_trigger(enabled: false)`. Disable,
   don't delete, so the history and next-run schedule survive a pause.

## On-demand automations (not scheduled)

- **PR babysitting**: after opening a PR, ask Claude to `subscribe_pr_activity` —
  CI failures and review comments then wake the session for autofix.
- **Batch screening**: "screen these 5 candidates" → fan out `recruiter-screener`
  subagents (one per candidate), then `/pipeline-report all` to aggregate.
