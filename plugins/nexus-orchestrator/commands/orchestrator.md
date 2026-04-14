---
name: orchestrator
description: Orchestrate complex software delivery with Think -> Plan -> Execute -> Validate -> Remember using the multi-agent workflow.
argument-hint: Describe goal, scope, constraints, acceptance criteria, and affected files.
agent: orchestrator
---

Coordinate this task end-to-end with the workflow:

{{args}}

Execution requirements:
- If required context is missing, ask up to 3 short blocking questions first.
- Run full orchestration: THINK -> PLAN -> EXECUTE -> VALIDATE -> REMEMBER.
- Delegate all substantive work through subagents only.
- Parallelize independent workstreams; keep dependency order where required.
- Re-plan only failed segments, not the full task, when validation fails.
- Persist decisions, failures, and outcomes to memory via historian step.

Response format:
## Outcomes
- What was completed

## Changes
- Files changed/created and why

## Validation
- Commands/checks executed and results

## Memory
- What was recorded for future sessions

## Next actions
- Only if follow-up is needed
