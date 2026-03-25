#!/usr/bin/env node

import process from "node:process";

const BLOCK_PATTERNS = [
    /\bgit\s+push\b/i,
    /\bgit\s+reset\s+--hard\b/i,
    /\brm\s+-rf\b/i,
    /\bdel\s+\/f\b/i,
    /\bformat\b/i
];

function readStdin() {
    return new Promise((resolve) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => {
            data += chunk;
        });
        process.stdin.on("end", () => resolve(data));
        process.stdin.on("error", () => resolve(""));
    });
}

function extractCommand(payload) {
    if (!payload || typeof payload !== "object") return "";

    const candidates = [
        payload.command,
        payload.input?.command,
        payload.tool_input?.command,
        payload.args?.command,
        payload.params?.command
    ];

    for (const value of candidates) {
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }

    return "";
}

function isGeminiEnvironment() {
    return Boolean(process.env.GEMINI_SESSION_ID);
}

function geminiRespond(response) {
    process.stdout.write(`${JSON.stringify(response)}\n`);
}

async function main() {
    const raw = await readStdin();
    let payload = {};

    if (raw.trim().length > 0) {
        try {
            payload = JSON.parse(raw);
        } catch {
            payload = {};
        }
    }

    const guardMode = (process.env.GUARD_MODE || "warn").toLowerCase();
    const command = extractCommand(payload);

    if (!command) {
        if (isGeminiEnvironment()) {
            geminiRespond({ decision: "allow" });
        }
        return;
    }

    const isBlocked = BLOCK_PATTERNS.some((pattern) => pattern.test(command));
    if (!isBlocked) {
        if (isGeminiEnvironment()) {
            geminiRespond({ decision: "allow" });
        }
        return;
    }

    const message = `Command blocked by nexus tool guardian: ${command}`;
    if (guardMode === "block") {
        process.stderr.write(`${message}\n`);
        if (isGeminiEnvironment()) {
            geminiRespond({ decision: "deny", reason: message });
        }
        process.exit(2);
        return;
    }

    process.stderr.write(`[warn] ${message}\n`);
    if (isGeminiEnvironment()) {
        geminiRespond({ decision: "allow", systemMessage: `[warn] ${message}` });
    }
}

main().catch((error) => {
    process.stderr.write(`tool-guardian failure: ${String(error)}\n`);
    if (isGeminiEnvironment()) {
        geminiRespond({ decision: "allow", systemMessage: "tool-guardian fallback: allow" });
    }
    process.exit(1);
});
