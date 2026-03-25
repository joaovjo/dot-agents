# Nexus Orchestrator

Nexus Orchestrator is a five-agent workflow for orchestrated software delivery.

Flow: Think -> Plan -> Execute -> Validate -> Remember.

## Platform Support

- GitHub Copilot CLI plugin
- Gemini CLI extension
- Claude Code plugin

## Local Validation and Build

From repository root:

```bash
bun run ci
```

This checks version alignment, validates structure, and builds dist artifacts for all platforms.

## Dist Artifacts

The build creates:

- `dist/nexus-orchestrator-copilot`
- `dist/nexus-orchestrator-gemini`
- `dist/nexus-orchestrator-claude`

## Install: GitHub Copilot CLI

Install from local folder:

```bash
copilot plugin install ./dist/nexus-orchestrator-copilot
```

List loaded plugins:

```bash
copilot plugin list
```

## Install: Gemini CLI

Install from local folder:

```bash
gemini extensions install ./dist/nexus-orchestrator-gemini --consent --skip-settings
```

Enable or verify:

```bash
gemini extensions enable nexus-orchestrator
gemini extensions update nexus-orchestrator
```

## Install: Claude Code

For local development session:

```bash
claude --plugin-dir ./dist/nexus-orchestrator-claude
```

When distributed through a marketplace, install with:

```bash
claude plugin install nexus-orchestrator@<marketplace>
```

## Hooks

- Copilot: `hooks.json`
- Gemini: `hooks/hooks.json` generated from `hooks/hooks.gemini.json`
- Claude: `hooks/hooks.json` generated from `hooks/hooks.claude.json`

All hook variants call `hooks/tool-guardian/guard-tool.mjs`.

## Versioning

Version source of truth:

- `plugins/nexus-orchestrator/.plugin/plugin.json`

Sync all target manifests and marketplace metadata:

```bash
bun run versions:sync
```

Check version alignment in CI:

```bash
bun run versions:check
```
