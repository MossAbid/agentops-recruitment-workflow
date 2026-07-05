# Routines — recurring tasks on a schedule

A routine is a scheduled trigger whose prompt is just "run `/skill-name`".
All logic stays in the skill (versioned in git); the routine only owns the *when*.

None of these are enabled yet — this file is the spec. To enable one, tell
Claude in a session on this repo: **"enable the &lt;name&gt; routine from
automations/ROUTINES.md"**. Claude creates it with `create_trigger` in
fresh-session mode so each firing starts clean.

## Catalog

| Routine | Cron | Prompt | Notes |
|---|---|---|---|
| `weekly-pipeline-report` | `0 8 * * 1` (Mon 08:00) | `Run /pipeline-report 7d in agentops-recruitment-workflow, commit the report to the default branch.` | Notify by email on completion. |
| `daily-ops-digest` | `30 8 * * 1-5` (weekdays 08:30) | `Run /ops-digest in agentops-recruitment-workflow, commit the report. Only send a push notification if the "Needs action" section is non-empty.` | Silence is the default; noise only when actionable. |
| `perflab-health` | `0 9 * * 6` (Sat 09:00) | `In perf-lab: run both test files in tests/, verify the latest Pages deploy succeeded, and check sw.js CACHE was bumped if shell files changed. Report only failures.` | Complements the in-app 7-day backup reminder. |

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
