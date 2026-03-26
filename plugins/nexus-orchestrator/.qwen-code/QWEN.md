# Nexus Orchestrator for Qwen Code

Five-agent workflow for orchestrated software delivery with a user-facing orchestrator plus thinker, planner, executor, and historian subagents.

## Installation

Add the marketplace:

```
/extension marketplace add joaovjo/dot-agents
```

Install the extension:

```
/extension install nexus-orchestrator@dot-agents-marketplace
```

## Usage

Use the `/nexus` command to start an orchestrated workflow:

```
/nexus <your task>
```

This will invoke the **Nexus Orchestrator** agent which coordinates four subagents:

| Agent | Purpose |
|---|---|
| **Thinker** | Decomposes complex requests into subtasks and surfaces hidden dependencies |
| **Planner** | Creates structured, step-by-step implementation plans |
| **Executor** | Carries out implementation steps |
| **Historian** | Persists decisions, plans, errors, and outcomes to `.memories/` |

## Workflow

```
User Request (/nexus)
    │
    ▼
[1] THINK   → Decompose task into subtasks
    │
    ▼
[2] PLAN    → Create structured implementation plan
    │
    ▼
[3] EXECUTE → Implement each plan segment
    │
    ▼
[4] VALIDATE → Review outcomes, re-delegate if needed
    │
    ▼
[5] REMEMBER → Persist to memory bank
    │
    ▼
Response to user
```

## Features

- **Parallel Execution**: Independent workstreams run concurrently
- **Memory Persistence**: All decisions and outcomes are saved to `.memories/`
- **Auditability**: UTC-timestamped memory files with WorldTimeAPI verification
- **Knowledge Graph**: JSONC index for fast context retrieval
- **Tool Guardian**: Hooks validate tool usage before execution

## Memory Bank

The extension uses a project-scoped memory bank at `.memories/` with:

- Session timelines
- Plan records
- Execution logs
- Error resolutions
- Architecture decisions
- Knowledge graph (`context/knowledge-graph.index.jsonc`)

All memory files use UTC-auditable filenames:
```
2026-03-24T22-40-05Z__session-summary.md
```

## Skills

### Memory Bank

Bootstrap, retrieve, update, and reconcile project memory.

```
/memory-bank mode=bootstrap|retrieve|update|reconcile; task=<goal>; project=<slug>
```

### Sequential Thinking

Structured thinking for complex problems.

```
/sequential-thinking
```

## Hooks

The extension includes a **Tool Guardian** hook that validates tool usage before execution, providing an additional safety layer for sensitive operations.

## License

MIT

## Author

Joao Vitor de Jesus Oliveira

## Repository

https://github.com/joaovjo/dot-agents
