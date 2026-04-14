import { join, relative, sep } from "node:path";

/**
 * PostToolUse hook that detects writes to .memories/raw/ and warns.
 * Enforces the "raw sources are immutable" invariant at the hook layer.
 *
 * Input: JSON on stdin with tool_name and tool_input fields.
 * Exit 0 always (warn-only, never blocks).
 */

const workspaceRoot = process.cwd();
const memoriesRoot = join(workspaceRoot, ".memories");
const rawRoot = join(memoriesRoot, "raw");

const writeTools = new Set(["Edit", "Write", "MultiEdit", "edit_file", "write_to_file", "replace_file_content", "multi_replace_file_content"]);

function isRawPath(filePath: string): boolean {
	const resolved = join(workspaceRoot, filePath);
	const rel = relative(rawRoot, resolved);
	// If the relative path doesn't start with "..", it's inside rawRoot
	return !rel.startsWith("..") && !rel.startsWith(sep);
}

async function checkRawImmutability(): Promise<string[]> {
	const warnings: string[] = [];

	let input: { tool_name?: string; tool_input?: Record<string, unknown> };
	try {
		// When run standalone (no piped input), stdin will be empty
		const stdinFile = Bun.stdin;
		const stdinText = await Promise.race([
			stdinFile.text(),
			new Promise<string>((resolve) => setTimeout(() => resolve(""), 1000)),
		]);
		if (!stdinText.trim()) return warnings;
		input = JSON.parse(stdinText);
	} catch {
		// If stdin isn't valid JSON, nothing to validate
		return warnings;
	}

	const toolName = input.tool_name ?? "";
	if (!writeTools.has(toolName)) return warnings;

	// Check various tool input shapes for file paths
	const pathFields = ["file_path", "path", "filePath", "TargetFile", "target_file"];
	for (const field of pathFields) {
		const value = input.tool_input?.[field];
		if (typeof value === "string" && isRawPath(value)) {
			warnings.push(
				`Write to immutable raw source detected: tool '${toolName}' targeting '${value}'. Raw sources (.memories/raw/) must never be modified.`,
			);
		}
	}

	return warnings;
}

try {
	const warnings = await checkRawImmutability();

	if (warnings.length === 0) {
		process.exit(0);
	}

	console.warn("Raw immutability guard warnings:");
	for (const warning of warnings) {
		console.warn(`  ⚠ ${warning}`);
	}

	// Warn only — do not block
	process.exit(0);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Raw immutability guard error: ${message}`);
	process.exit(0);
}
