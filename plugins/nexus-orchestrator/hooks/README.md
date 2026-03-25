# Hook Guardrails

This directory contains guardrail hooks used to reduce accidental destructive tool usage.

## Files

- `tool-guardian/guard-tool.ts`: checks hook payload for suspicious destructive patterns using Bun runtime.

## Modes

Set `GUARD_MODE` when invoking hooks:

- `warn` (default): warns but allows execution.
- `block`: blocks suspicious commands by exiting with non-zero code.

## Notes

- This is a safety net, not a full security sandbox.
- Review and tune patterns to match your repository policies.
- Requires Bun available in `PATH` because the hook command runs with Bun.
