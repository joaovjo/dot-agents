# Hook Adapters

This directory stores platform-specific hook adapters.

## Files

- `hooks.gemini.json`: Gemini CLI hook schema
- `hooks.claude.json`: Claude Code hook schema
- `tool-guardian/guard-tool.mjs`: shared guard command

## Build Mapping

During `npm run build`:

- Gemini artifact receives `hooks/hooks.json` from `hooks.gemini.json`
- Claude artifact receives `hooks/hooks.json` from `hooks.claude.json`
- Copilot artifact keeps root `hooks.json`
