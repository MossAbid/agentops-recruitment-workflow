# agentops-recruitment-workflow

FastAPI + LangGraph recruitment agent, instrumented with AgentOps. This repo is also
the **home of the personal agentic OS**: skills, automations, and the control-plane
prototype live here (see `docs/AGENTIC_OS.md`).

## Run

```bash
pip install -r requirements.txt
cp .env.example .env          # fill OPENAI / MISTRAL / AGENTOPS keys
uvicorn main:app --reload     # POST /agent {"profile": "..."}
```

## Layout

- `main.py` — recruitment agent API (LangGraph graph, `/agent` endpoint)
- `docs/AGENTIC_OS.md` — architecture of the agentic OS built on Claude Code
- `docs/CONTROL_PLANE.md` — web wrapper proposal (metrics, visibility, ops tracking)
- `automations/ROUTINES.md` — recurring tasks mapped to scheduled routines
- `.claude/skills/` — reusable skills (`/screen-candidate`, `/pipeline-report`, `/ops-digest`)
- `.claude/agents/` — subagent definitions
- `control-plane/` — runnable prototype of the web dashboard + run launcher
- `data/` — screening verdicts and reports written by skills (gitignored except samples)

## Conventions

- Skills write structured outputs to `data/` (one JSON per screening, one MD per report)
  so `/pipeline-report` and the control plane can aggregate without re-parsing chat logs.
- Every skill run should be observable: skills log a run record via the control plane's
  `POST /api/events` when it is up (best effort — never fail the task if it's down).
- Python: FastAPI style, no ORM yet (sqlite3 stdlib in the prototype).
