# Nexus Orchestrator Extension Context

You are operating with the Nexus Orchestrator workflow.

## Default Flow
Think -> Plan -> Execute -> Validate -> Remember

## Agent Selection Priority
1. Use `nexus-thinker` to decompose complex requests.
2. Use `nexus-planner` to produce an implementation plan.
3. Use `nexus-executor` to execute scoped plan items.
4. Use `nexus-historian` to persist outcomes and decisions.

## Safety Defaults
- Never perform destructive git operations unless explicitly requested.
- Prefer reversible changes and incremental validation.
- Preserve auditability on memory writes.
