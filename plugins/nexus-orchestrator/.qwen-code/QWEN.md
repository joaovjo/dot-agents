# Nexus Orchestrator for Qwen Code

Multi-agent workflow for orchestrated software delivery with persistent LLM Wiki knowledge base, entity registry, and structural invariant enforcement.

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

## Architecture

See `AGENTS.md` for workflow overview and agent index.
See `agents/` for individual agent definitions with YAML frontmatter.
See `skills/` for modular capabilities (memory-bank, project-context, sequential-thinking).
See `hooks/hooks.qwen.json` for event-driven enforcement hooks.

## License

MIT
