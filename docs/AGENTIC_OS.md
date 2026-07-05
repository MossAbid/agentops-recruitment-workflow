# Agentic OS on Claude Code — Design

A personal "operating system" where Claude Code is the kernel, skills are the
programs, subagents are the processes, scheduled routines are cron, and a thin
web control plane provides metrics, visibility, and operational tracking.

## 1. The analogy, made concrete

| OS concept | Agentic equivalent | Where it lives |
|---|---|---|
| Kernel | Claude Code (CLI / web / SDK) | managed environments |
| Programs / binaries | **Skills** (`.claude/skills/*/SKILL.md`) | each repo |
| Processes | **Subagents** (`.claude/agents/*.md`) | each repo |
| cron | **Routines** (scheduled triggers firing prompts into sessions) | `automations/ROUTINES.md` |
| Config / rc files | `CLAUDE.md` + `.claude/settings.json` | each repo |
| Syscall log / top | **Control plane** (runs, metrics, dashboard) | `control-plane/` |
| IPC | Structured files in `data/` + control-plane events API | this repo |

Design rule: **skills own the "how", routines own the "when", the control plane
owns the "what happened"**. A skill must be runnable by hand (`/skill-name`) and
by a routine with zero changes.

## 2. Layer diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Control plane (FastAPI + dashboard)                         │
│  launch runs · run history · metrics · routine calendar      │
├──────────────────────────────────────────────────────────────┤
│  Routines (cron triggers)      │  Interactive sessions       │
│  weekly pipeline report        │  "/screen-candidate <cv>"   │
│  daily ops digest              │  "/perflab-program ..."     │
├────────────────────────────────┴─────────────────────────────┤
│  Skills (reusable procedures)  │  Subagents (scoped workers) │
├──────────────────────────────────────────────────────────────┤
│  Claude Code kernel  ·  MCP (GitHub, Gmail, Calendar, Drive) │
├──────────────────────────────────────────────────────────────┤
│  Repos: agentops-recruitment-workflow · perf-lab             │
└──────────────────────────────────────────────────────────────┘
```

## 3. Recurring tasks → skills & automations

Inventory derived from the two repos and their history:

| Recurring task | Today | Becomes | Cadence |
|---|---|---|---|
| Screen a candidate profile | ad-hoc prompt / `POST /agent` | **`/screen-candidate`** skill → verdict JSON in `data/screenings/` | on demand |
| Recruitment pipeline review | manual | **`/pipeline-report`** skill aggregating `data/screenings/` | weekly routine (Mon 08:00) |
| Repo health: PRs, CI, deps, deploy state | manual glance | **`/ops-digest`** skill (GitHub MCP across both repos) | daily routine (08:30) |
| Generate a Perf Lab training program | "ask Claude, paste JSON" (per README) | **`/perflab-program`** skill in perf-lab — schema-validated output | on demand |
| Perf Lab release: tests, `sw.js` CACHE bump, Pages deploy check | manual checklist | **`/perflab-release`** skill in perf-lab | every shell change |
| PR review & CI babysitting | manual | built-in `/code-review` + `subscribe_pr_activity` | per PR |

Skills for a repo live **in that repo** so they load automatically when a session
opens there: recruitment + ops skills here, Perf Lab skills in `perf-lab`.

## 4. Skill anatomy (convention)

Every `SKILL.md` follows the same shape so skills stay composable:

1. **Frontmatter** — `name`, `description` (the trigger surface).
2. **Inputs** — what the argument string means; what to ask for if missing.
3. **Procedure** — numbered steps, referencing real files/commands, never "figure it out".
4. **Output contract** — exactly what files/records the skill writes (this is the IPC
   layer: `/pipeline-report` consumes what `/screen-candidate` produces).
5. **Telemetry** — best-effort `POST` to the control plane; never blocks the task.

When to use what:
- **Skill** — a procedure you'd otherwise re-explain in chat. Deterministic steps, one goal.
- **Subagent** — the procedure needs isolation (big context, restricted tools, parallel fan-out).
- **Routine** — the procedure should happen without you asking. A routine's prompt is
  always just "run `/skill-name`" — never inline instructions, so behavior stays versioned in git.

## 5. Observability

Three complementary layers, cheapest first:

1. **Files in git** — every skill writes its artifact to `data/` or `reports/`.
   Greppable, diffable, survives everything.
2. **Control plane events** — skills and Claude Code hooks post run records
   (skill, repo, status, duration, tokens) to `POST /api/events`. Powers the dashboard.
3. **AgentOps traces** — already wired into `main.py` for LLM-level spans of the
   recruitment agent itself. The control plane links out to it rather than duplicating it.

## 6. Roadmap

- **Phase 0 (this PR)** — skills + routine specs + control-plane prototype + dashboard.
- **Phase 1** — enable the two routines; add the Stop-hook that auto-posts run records
  (snippet in `docs/CONTROL_PLANE.md`); wire `/screen-candidate` into `main.py`'s graph
  so API and skill share one rubric.
- **Phase 2** — control plane launches runs via the Claude Agent SDK instead of raw
  subprocess; SSE live streaming of active runs; auth.
- **Phase 3** — cost budgets per routine, alerting (push notification when a routine
  fails twice), multi-user.
