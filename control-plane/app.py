"""Control plane prototype — launch Claude Code runs, ingest events, serve metrics.

Run:  uvicorn control-plane.app:app --port 8090   (from the repo root)
See:  docs/CONTROL_PLANE.md
"""
import json
import sqlite3
import subprocess
import threading
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DB = Path(__file__).parent / "control.db"
STATIC = Path(__file__).parent / "static"

# Launchable skills only — this endpoint is a launcher, not a remote shell.
SKILLS = {
    "screen-candidate": "..",
    "pipeline-report": "..",
    "ops-digest": "..",
    "perflab-program": "../../perf-lab",
    "perflab-release": "../../perf-lab",
}

app = FastAPI(title="Agentic OS Control Plane", version="0.1")


def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init():
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS runs(
          id TEXT PRIMARY KEY, skill TEXT, repo TEXT, trigger_src TEXT,
          status TEXT, started_at REAL, ended_at REAL,
          tokens_in INTEGER DEFAULT 0, tokens_out INTEGER DEFAULT 0,
          cost_usd REAL DEFAULT 0, artifact TEXT, detail TEXT);
        CREATE TABLE IF NOT EXISTS events(
          id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT, ts REAL,
          kind TEXT, payload TEXT);
        """)


init()


class LaunchReq(BaseModel):
    skill: str
    args: str = ""
    trigger_src: str = "human"


class Event(BaseModel):
    skill: str = "session"
    repo: str = ""
    status: str = "ok"
    run_id: str | None = None
    detail: str = ""
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    artifact: str = ""


def _run(run_id: str, skill: str, args: str, cwd: Path):
    """Execute a headless run and record the outcome. Runs in a thread."""
    cmd = ["claude", "-p", f"/{skill} {args}".strip(),
           "--output-format", "json"]
    status, detail, usage = "ok", "", {}
    try:
        out = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True,
                             timeout=1800)
        if out.returncode != 0:
            status, detail = "failed", (out.stderr or out.stdout)[-500:]
        else:
            try:
                usage = json.loads(out.stdout).get("usage", {})
            except (json.JSONDecodeError, AttributeError):
                pass
    except FileNotFoundError:
        status, detail = "failed", "claude CLI not on PATH"
    except subprocess.TimeoutExpired:
        status, detail = "failed", "timeout after 30 min"
    with db() as c:
        c.execute(
            "UPDATE runs SET status=?, ended_at=?, tokens_in=?, tokens_out=?,"
            " detail=? WHERE id=?",
            (status, time.time(), usage.get("input_tokens", 0),
             usage.get("output_tokens", 0), detail, run_id))


@app.post("/api/runs")
def launch(req: LaunchReq):
    if req.skill not in SKILLS:
        raise HTTPException(400, f"unknown skill; allowed: {sorted(SKILLS)}")
    cwd = (Path(__file__).parent / SKILLS[req.skill]).resolve()
    run_id = uuid.uuid4().hex[:12]
    with db() as c:
        c.execute(
            "INSERT INTO runs(id, skill, repo, trigger_src, status, started_at)"
            " VALUES (?,?,?,?,'running',?)",
            (run_id, req.skill, cwd.name, req.trigger_src, time.time()))
    threading.Thread(target=_run, args=(run_id, req.skill, req.args, cwd),
                     daemon=True).start()
    return {"run_id": run_id}


@app.post("/api/events")
def ingest(ev: Event):
    """Best-effort ingestion from skills and Stop hooks. Partial records OK."""
    with db() as c:
        if ev.run_id:
            c.execute("UPDATE runs SET status=?, ended_at=? WHERE id=?",
                      (ev.status, time.time(), ev.run_id))
        else:
            c.execute(
                "INSERT INTO runs(id, skill, repo, trigger_src, status,"
                " started_at, ended_at, tokens_in, tokens_out, cost_usd,"
                " artifact, detail)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (uuid.uuid4().hex[:12], ev.skill, ev.repo, "event", ev.status,
                 time.time(), time.time(), ev.tokens_in, ev.tokens_out,
                 ev.cost_usd, ev.artifact, ev.detail))
        c.execute("INSERT INTO events(run_id, ts, kind, payload) VALUES (?,?,?,?)",
                  (ev.run_id or "", time.time(), "ingest", ev.json()))
    return {"ok": True}


@app.get("/api/runs")
def runs(limit: int = 50, skill: str = "", repo: str = ""):
    q, p = "SELECT * FROM runs WHERE 1=1", []
    if skill:
        q, p = q + " AND skill=?", p + [skill]
    if repo:
        q, p = q + " AND repo=?", p + [repo]
    with db() as c:
        rows = c.execute(q + " ORDER BY started_at DESC LIMIT ?",
                         p + [limit]).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/metrics/summary")
def summary(days: int = 30):
    since = time.time() - days * 86400
    with db() as c:
        rows = [dict(r) for r in c.execute(
            "SELECT * FROM runs WHERE started_at > ?", (since,)).fetchall()]
    done = [r for r in rows if r["status"] != "running"]
    ok = [r for r in done if r["status"] == "ok"]
    durs = sorted(r["ended_at"] - r["started_at"] for r in done if r["ended_at"])
    by_day: dict[str, dict] = {}
    for r in rows:
        d = time.strftime("%Y-%m-%d", time.localtime(r["started_at"]))
        by_day.setdefault(d, {"ok": 0, "failed": 0})
        by_day[d][r["status"] if r["status"] == "failed" else "ok"] += 1
    by_skill: dict[str, dict] = {}
    for r in done:
        s = by_skill.setdefault(r["skill"], {"runs": 0, "ok": 0})
        s["runs"] += 1
        s["ok"] += r["status"] == "ok"
    return {
        "runs": len(rows),
        "success_rate": round(len(ok) / len(done), 3) if done else None,
        "p95_duration_s": round(durs[int(len(durs) * 0.95) - 1], 1) if durs else None,
        "cost_usd": round(sum(r["cost_usd"] for r in rows), 2),
        "by_day": by_day,
        "by_skill": by_skill,
    }


app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")
