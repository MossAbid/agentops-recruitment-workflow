# Control Plane — web wrapper proposal

A thin web layer over Claude Code that answers three questions at a glance:
**what is running, what happened, what does it cost.** It never re-implements
the agent — Claude Code stays the kernel; the control plane launches runs,
ingests events, and renders them.

A runnable prototype lives in `control-plane/` (FastAPI + SQLite + one-file
dashboard). This doc is the target design.

## 1. Goals / non-goals

**Goals**
- **Visibility** — live and historical runs: which skill, which repo, triggered
  by whom (human / routine / PR event), status, duration, artifact link.
- **Metrics** — runs/day, success rate, p50/p95 duration, token & cost per
  skill and per routine; trend over 30 days.
- **Operational tracking** — routine calendar (fired / succeeded / failed / skipped
  per day), failure streaks, "needs action" items surfaced from `/ops-digest`.

**Non-goals** — chat UI (Claude Code web already is one), LLM-span tracing
(AgentOps already does it for `main.py`; the dashboard links out per run),
multi-tenant auth before Phase 3.

## 2. Architecture

```
 human ──┐                                   ┌─> SQLite (runs, events, routines)
 routine ─┼─> FastAPI control plane ─────────┤
 PR event┘      │        ▲                   └─> dashboard (static, /)
                │        │ POST /api/events
                ▼        │
        claude -p "/skill …"  (headless run, --output-format stream-json)
                │
                └─ Stop hook posts final run record
```

Two ingestion paths, deliberately redundant:
1. **Launcher-side**: when the control plane starts a run it records start/end,
   exit code, and parses token usage from `stream-json` output.
2. **Hook-side**: a `Stop` hook in each repo posts a run record even for runs
   the control plane didn't launch (interactive sessions, routines fired
   elsewhere). Snippet for `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "curl -s -m 2 -X POST localhost:8090/api/events -H 'content-type: application/json' -d \"{\\\"skill\\\":\\\"session\\\",\\\"repo\\\":\\\"$(basename $PWD)\\\",\\\"status\\\":\\\"ok\\\"}\" || true"
      }]
    }]
  }
}
```

## 3. Data model

```sql
runs(id, skill, repo, trigger,        -- 'human' | 'routine:<name>' | 'pr:<num>'
     status,                          -- 'running' | 'ok' | 'failed'
     started_at, ended_at,
     tokens_in, tokens_out, cost_usd, -- from stream-json usage, when launched here
     artifact,                        -- path of the file the skill wrote
     detail)                          -- error summary on failure
events(id, run_id, ts, kind, payload) -- raw ingested events, append-only
routines(name, cron, enabled, last_fired_at, last_status, fail_streak)
```

## 4. API surface

| Endpoint | Purpose |
|---|---|
| `POST /api/runs {skill, repo, args}` | launch a headless run, returns `run_id` |
| `GET /api/runs?repo=&skill=&limit=` | run history |
| `GET /api/runs/{id}` | one run + its events |
| `POST /api/events` | ingestion (skills, hooks) — accepts partial records |
| `GET /api/metrics/summary?days=30` | tiles + series the dashboard renders |
| `GET /api/routines` | routine calendar state |

## 5. Dashboard

One static page (`control-plane/static/index.html`), no build step:
- **Tiles**: runs (7d), success rate, p95 duration, est. cost (7d).
- **Runs per day** bar chart (ok vs failed), 30 days.
- **Skill leaderboard**: runs, success %, median duration per skill.
- **Recent runs** table with trigger source and artifact link.
- **Routine board**: per routine — enabled, last fired, fail streak.

Falls back to demo data when the API is unreachable, so the page doubles as
the design mockup.

## 6. Security

- Binds to `localhost:8090` only in the prototype. Anything beyond a single
  machine needs a token on `POST /api/runs` (it executes an agent) before
  exposure; `GET`s can stay read-only behind the same reverse proxy.
- `POST /api/runs` accepts only allowlisted skills (`SKILLS` set in `app.py`) —
  it is a launcher, not a remote shell. Args are passed as a single prompt
  string to `claude -p`, never to a shell.

## 7. Rollout

1. **Now**: prototype + hook ingestion on this repo. Judge signal-to-noise for a week.
2. **Phase 2**: replace subprocess with the Claude Agent SDK (structured usage
   & cost natively), add SSE `/api/runs/{id}/stream` for live tail, token auth.
3. **Phase 3**: budgets per routine (halt + notify when exceeded), failure-streak
   push alerts, Postgres if this ever leaves one machine.
