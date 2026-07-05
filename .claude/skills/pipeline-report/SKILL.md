---
name: pipeline-report
description: Aggregate candidate screening verdicts into a recruitment pipeline report. Use when asked for a pipeline report, recruitment summary, or weekly hiring status — also fired weekly by a routine.
---

# Recruitment pipeline report

## Inputs

Optional period argument (`7d` default, or `30d`, or `all`).

## Procedure

1. Read every `data/screenings/*.json` whose `date` falls in the period.
   If there are none, say so plainly and stop — do not fabricate a report.
2. Aggregate: totals by verdict, by role, average scores per criterion,
   and list `advance` candidates with their top interview question.
3. Flag anomalies worth a human look: roles with 100% rejects (rubric too
   strict?), criteria that never score above 2 (sourcing mismatch?),
   candidates screened twice with different verdicts.
4. Write the report (contract below) and give a 5-line summary in chat:
   totals, advances by name, and the single most actionable anomaly.

## Output contract

Write `reports/pipeline/<yyyy-ww>.md` (ISO week). Overwrite if re-run in the
same week — the report is a snapshot, not a log. Structure: `## Totals`,
`## Advances`, `## By role`, `## Anomalies`.

## Telemetry

Same best-effort event POST as `/screen-candidate`, with `"skill":"pipeline-report"`.
