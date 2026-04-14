import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * PostToolUse hook that validates .memories/log.md entries use the
 * parseable prefix format: ## [YYYY-MM-DDTHH:MM:SSZ] <operation> | <title>
 *
 * This ensures the log stays `grep`-parseable:
 *   grep "^## \[" log.md | tail -5
 *
 * Exit 0 always (warn-only).
 */

const workspaceRoot = process.cwd();
const logPath = join(workspaceRoot, ".memories", "log.md");

const logEntryPattern =
	/^## \[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\] \w[\w-]* \| .+$/;

async function validateLogFormat(): Promise<string[]> {
	const warnings: string[] = [];

	if (!existsSync(logPath)) return warnings;

	const content = await Bun.file(logPath).text();
	const lines = content.split(/\r?\n/);

	let lineNumber = 0;
	for (const line of lines) {
		lineNumber++;
		// Only validate lines that look like log entry headers
		if (line.startsWith("## [") || line.startsWith("## ")) {
			if (line.startsWith("## [") && !logEntryPattern.test(line)) {
				warnings.push(
					`log.md:${lineNumber}: malformed entry — expected '## [YYYY-MM-DDTHH:MM:SSZ] operation | title' but got: ${line.substring(0, 80)}`,
				);
			}
		}
	}

	return warnings;
}

try {
	const warnings = await validateLogFormat();

	if (warnings.length === 0) {
		process.exit(0);
	}

	console.warn("Log format validation warnings:");
	for (const warning of warnings) {
		console.warn(`  ⚠ ${warning}`);
	}

	process.exit(0);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Log format validation error: ${message}`);
	process.exit(0);
}
