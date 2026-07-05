# Control plane prototype

Design: `docs/CONTROL_PLANE.md`.

```bash
pip install -r ../requirements.txt          # fastapi + uvicorn already listed
uvicorn app:app --port 8090                 # from this directory
open http://localhost:8090                  # dashboard (demo data until runs exist)
```

Try it:

```bash
# launch a headless skill run (needs `claude` CLI on PATH)
curl -X POST localhost:8090/api/runs -H 'content-type: application/json' \
     -d '{"skill":"ops-digest"}'

# ingest an event manually (what skills / Stop hooks do)
curl -X POST localhost:8090/api/events -H 'content-type: application/json' \
     -d '{"skill":"screen-candidate","repo":"agentops-recruitment-workflow","status":"ok"}'
```

`control.db` (SQLite) is created next to `app.py` and is gitignored.
The dashboard is a single static file with no build step; it falls back to demo
data when the API is empty or unreachable, so it doubles as the design mockup.
