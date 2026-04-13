---
name: orchestrator
description: Orchestrate complex software delivery with Think -> Plan -> Execute -> Validate -> Remember using the custom agent.
argument-hint: Describe goal, scope, constraints, acceptance criteria, and affected files.
agent: orchestrator
tools: [vscode, execute, read, agent, edit, search, web, 'github/*', 'better-auth/*', 'shadcn/*', browser, 'bun-mcp/*', 'chrome-devtools-mcp/*', 'context7/*', 'deepwiki/*', 'docfork/*', 'firecrawl/*', 'github/*', 'sequential-thinking/*', 'vercel/*', 'gitkraken/*', vscode.mermaid-chat-features/renderMermaidDiagram, github.vscode-pull-request-github/issue_fetch, github.vscode-pull-request-github/labels_fetch, github.vscode-pull-request-github/notification_fetch, github.vscode-pull-request-github/doSearch, github.vscode-pull-request-github/activePullRequest, github.vscode-pull-request-github/pullRequestStatusChecks, github.vscode-pull-request-github/openPullRequest, github.vscode-pull-request-github/resolveReviewThread, mermaidchart.vscode-mermaid-chart/get_syntax_docs, mermaidchart.vscode-mermaid-chart/mermaid-diagram-validator, mermaidchart.vscode-mermaid-chart/mermaid-diagram-preview, ms-azuretools.vscode-containers/containerToolsConfig, todo]
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
