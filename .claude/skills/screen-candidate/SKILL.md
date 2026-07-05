---
name: screen-candidate
description: Screen a candidate profile against a role rubric and produce a structured verdict. Use when the user shares a CV, LinkedIn text, or candidate profile and asks to evaluate, screen, or analyse a candidate.
---

# Screen a candidate

## Inputs

The argument is the candidate profile: pasted text, a file path, or a URL
(fetch it). Optionally a role name after `--role`. If no role is given, ask
which role, or use `data/roles/default.md` if it exists.

## Procedure

1. Load the role rubric from `data/roles/<role>.md`. If it doesn't exist,
   derive a rubric from the role name (must-haves, nice-to-haves, red flags),
   write it to that path, and tell the user you seeded it so they can edit it.
2. Evaluate the profile against each rubric line. Quote evidence from the
   profile for every score — no unsupported claims.
3. Decide a verdict: `advance` | `maybe` | `reject`, with a one-paragraph
   rationale and 3 suggested interview questions targeting the weakest evidence.
4. Write the verdict record (output contract below), then summarize verdict +
   rationale + questions in chat.

## Output contract

Write `data/screenings/<yyyy-mm-dd>-<candidate-slug>.json`:

```json
{
  "date": "2026-07-05",
  "candidate": "jane-doe",
  "role": "backend-engineer",
  "verdict": "advance",
  "scores": [{"criterion": "...", "score": 0-5, "evidence": "..."}],
  "rationale": "...",
  "questions": ["...", "...", "..."]
}
```

`/pipeline-report` aggregates these files — never change field names without
updating that skill too.

## Telemetry

Best effort, never blocking:
`curl -s -m 2 -X POST localhost:8090/api/events -H 'content-type: application/json' -d '{"skill":"screen-candidate","repo":"agentops-recruitment-workflow","status":"ok"}' || true`
