---
name: sequential-thinking
description: 'Internal sequential reasoning protocol for nexus-orchestrator and nexus-thinker. Apply MCP-style numbered thoughts, revisions, branches, dynamic thought budgets, and verified solution hypotheses for complex decomposition, re-planning, and failure diagnosis.'
user-invocable: false
---

# Sequential Thinking for Nexus Orchestrator

Use this skill to run a structured reasoning loop before planning, re-planning, or diagnosing failures.
It mirrors the Sequential Thinking MCP concept and adapts it to the Nexus multi-agent workflow.

## Invocation Policy
- Not user-facing.
- Loaded and applied by the orchestrator flow.
- Primary usage points: pre-planning, re-planning, and post-failure diagnosis.

## Core Principle
Sequential Thinking solves complex problems by decomposing them into small, explicit thought steps.
Each step can be revised when new evidence appears, branched when alternatives exist, and consolidated into a final verified hypothesis.

## When to Use
- Complex requests that cannot be solved safely in one pass.
- Tasks with unclear scope, changing requirements, or hidden dependencies.
- Failure recovery after an execution error.
- Design choices that need trade-off analysis before implementation.
- Situations where irrelevant context must be filtered out.

## Integration Patterns

### With Nexus Workflow
Think (this skill) -> Plan -> Execute -> Validate -> Remember

### With TDD Tasks
Think (Sequential) -> Red -> Green -> Refactor

- Think: define behaviors, dependencies, and risks before coding.
- Red: write failing tests based on the verified thought chain.
- Green: implement minimum changes to satisfy tests.
- Refactor: improve structure without breaking tests.
- Think (review): record revisions and final decisions when context changes.

## Expected Inputs
- `task`: clear objective to solve.
- `context`: known facts, files, previous outputs.
- `constraints`: technical, time, policy, or tool constraints.
- `successCriteria`: explicit completion checks.
- `failureContext` (optional): error details from prior execution attempts.

## Sequential Thought Schema
For each thought, track fields equivalent to MCP Sequential Thinking:

- `thought`: current reasoning step.
- `thoughtNumber`: current thought index.
- `totalThoughts`: current estimate of total thoughts.
- `nextThoughtNeeded`: whether to continue.
- `isRevision` (optional): true when revisiting a prior thought.
- `revisesThought` (optional): thought number being revised.
- `branchFromThought` (optional): origin thought for an alternative branch.
- `branchId` (optional): identifier for branch lineage.
- `needsMoreThoughts` (optional): set when estimate must increase.

## Thought Entry Template
Each thought should also include concise planning semantics:

```markdown
## Thought N/Total [Progression | Revision | Branch | Consolidation]

Context: what is known at this point
Objective: what this thought must resolve
Decision: chosen path and why
Next Step: immediate follow-up action
```

Thought types:
- Progression: advances naturally to the next step.
- Revision: updates a prior thought due to new evidence.
- Branch: explores an alternative approach before deciding.
- Consolidation: merges branch outcomes into one final direction.

## Procedure
1. Define the initial scope
- Restate the task in one sentence.
- Set an initial thought budget (`totalThoughts`) based on `depth`:
  - `quick`: 3-5 thoughts
  - `standard`: 5-8 thoughts
  - `deep`: 8-12 thoughts

2. Run incremental thoughts
- Produce one thought at a time.
- After each thought, decide if another thought is needed.
- Keep reasoning concrete: dependencies, risks, assumptions, and unknowns.

3. Revise when assumptions break
- If a prior step is wrong or incomplete, mark `isRevision: true`.
- Point to the exact thought with `revisesThought`.
- Replace the invalid assumption and continue from corrected state.

4. Branch for alternatives
- When there are materially different approaches, create branches.
- Set `branchFromThought` and `branchId` to keep alternatives traceable.
- Compare branches explicitly before converging.

5. Consolidate branch outcomes
- If multiple branches were explored, produce one explicit consolidation thought.
- State discarded alternatives and the reason they were rejected.

6. Adjust thought budget dynamically
- Increase `totalThoughts` when new complexity appears (`needsMoreThoughts: true`).
- Decrease or stop early when confidence is high and checks pass.

7. Form and verify a solution hypothesis
- State a single proposed solution.
- Verify it against:
  - constraints
  - dependency order
  - failure modes
  - success criteria
- If verification fails, continue the thought loop.

8. Produce orchestrator-ready output
- Return the final thought chain plus:
  - recommended next action
  - task decomposition
  - parallelism opportunities
  - key risks and mitigations
  - open information gaps

## Output Contract
Use this structure for handoff:

```markdown
## Thought Chain

### Thought N/M
- thought: <text>
- thoughtNumber: <int>
- totalThoughts: <int>
- nextThoughtNeeded: <true|false>
- isRevision: <optional true|false>
- revisesThought: <optional int>
- branchFromThought: <optional int>
- branchId: <optional string>
- needsMoreThoughts: <optional true|false>

## Solution Hypothesis
- <single best proposed path>

## Verification
- Constraints: <pass/fail + reason>
- Dependencies: <pass/fail + reason>
- Risks: <top risks + mitigation>
- Success Criteria: <pass/fail + reason>

## Recommended Next Action
- <what the orchestrator should do now>
```

If invoked inside `nexus-thinker`, align the final handoff to the exact format defined in `agents/thinker-subagent.md`.

## Quality Gates
Before ending the loop (`nextThoughtNeeded: false`), ensure:
- A testable solution hypothesis exists.
- At least one explicit verification pass was completed.
- Revisions and branches (if any) are reconciled.
- Remaining unknowns are listed as information gaps.
- Output is actionable for Planner and Executor without hidden assumptions.

## Revision and Branch Triggers
Trigger a revision when:
- New information contradicts a prior decision.
- An edge case invalidates an assumption.
- Validation or tests fail against the plan.
- Review feedback exposes a structural issue.

Trigger a branch when:
- Multiple approaches have meaningful trade-offs.
- Technical feasibility is uncertain.
- One approach optimizes speed while another optimizes safety.

## Recommended Practices
Do:
- Keep thoughts numbered and traceable.
- Explain why an option was chosen over alternatives.
- Keep each thought focused on one decision cluster.
- Use thought outputs to drive tests and execution order.

Avoid:
- Vague thoughts without explicit decisions.
- Hiding changes of direction without marking revision.
- Treating thought chains as a substitute for tests.
- Mixing unrelated decisions in one thought.

## Nexus Integration Notes
- `nexus-orchestrator`: invoke this skill before first planning and after failures.
- `nexus-thinker`: use this schema as the internal reasoning protocol.
- `nexus-planner`: consume verified hypothesis and dependency map.
- `nexus-historian`: persist thought chain snapshots for decision traceability.
