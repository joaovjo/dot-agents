#!/usr/bin/env bun

const rootDir = process.cwd();
const pluginRoot = `${rootDir}/plugins/nexus-orchestrator`;

const requiredFiles = [
    ".plugin/plugin.json",
    ".claude-plugin/plugin.json",
    "gemini-extension.json",
    "hooks.json",
    "hooks/hooks.gemini.json",
    "hooks/hooks.claude.json",
    "hooks/tool-guardian/guard-tool.mjs",
    "agents/orchestrator.md",
    "agents/thinker-subagent.md",
    "agents/planner-subagent.md",
    "agents/executor-subagent.md",
    "agents/historian-subagent.md",
    "skills/memory-bank/SKILL.md",
    "skills/sequential-thinking/SKILL.md"
] as const;

type Manifest = {
    name: string;
    version: string;
};

type Marketplace = {
    name: string;
    metadata: {
        version: string;
    };
    plugins: Array<{
        name: string;
        version: string;
        source: string;
    }>;
};

async function readJson<T>(filePath: string): Promise<T> {
    return (await Bun.file(filePath).json()) as T;
}

function joinPath(...parts: string[]): string {
    return parts.join("/").replaceAll("\\", "/").replace(/\/+/g, "/");
}

function relativePath(fromPath: string, toPath: string): string {
    const normalizedFrom = fromPath.replaceAll("\\", "/");
    const normalizedTo = toPath.replaceAll("\\", "/");
    return normalizedTo.startsWith(`${normalizedFrom}/`) ? normalizedTo.slice(normalizedFrom.length + 1) : normalizedTo;
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function validateMarketplaceEntry(marketplace: Marketplace, pluginName: string, label: string): void {
    const pluginEntry = (marketplace.plugins || []).find((entry) => entry.name === pluginName);
    assert(Boolean(pluginEntry), `${label} entry not found for ${pluginName}`);
    const checkedPluginEntry = pluginEntry as Marketplace["plugins"][number];

    assert(
        checkedPluginEntry.source === "./plugins/nexus-orchestrator",
        `${label} source must be ./plugins/nexus-orchestrator`
    );
}

async function validateRequiredFiles(): Promise<void> {
    for (const fileRelativePath of requiredFiles) {
        const absolutePath = joinPath(pluginRoot, fileRelativePath);
        const exists = await Bun.file(absolutePath).exists();
        assert(exists, `Missing required file: ${fileRelativePath}`);
    }

    const marketplaceFiles = [
        joinPath(rootDir, ".claude-plugin", "marketplace.json"),
        joinPath(rootDir, ".github", "plugin", "marketplace.json")
    ];

    for (const filePath of marketplaceFiles) {
        const exists = await Bun.file(filePath).exists();
        assert(exists, `Missing required marketplace file: ${relativePath(rootDir, filePath)}`);
    }
}

async function validateManifestVersions(): Promise<void> {
    const copilot = await readJson<Manifest>(joinPath(pluginRoot, ".plugin", "plugin.json"));
    const claude = await readJson<Manifest>(joinPath(pluginRoot, ".claude-plugin", "plugin.json"));
    const gemini = await readJson<Manifest>(joinPath(pluginRoot, "gemini-extension.json"));
    const claudeMarketplace = await readJson<Marketplace>(joinPath(rootDir, ".claude-plugin", "marketplace.json"));
    const copilotMarketplace = await readJson<Marketplace>(joinPath(rootDir, ".github", "plugin", "marketplace.json"));

    validateMarketplaceEntry(claudeMarketplace, copilot.name, "Claude marketplace");
    validateMarketplaceEntry(copilotMarketplace, copilot.name, "Copilot marketplace");

    assert(copilot.version === claude.version, "Copilot and Claude versions must match");
    assert(copilot.version === gemini.version, "Copilot and Gemini versions must match");
    assert(copilot.version === claudeMarketplace.metadata.version, "Copilot and Claude marketplace metadata versions must match");
    assert(copilot.version === copilotMarketplace.metadata.version, "Copilot and Copilot marketplace metadata versions must match");

    const claudePluginEntry = claudeMarketplace.plugins.find((entry) => entry.name === copilot.name);
    const copilotPluginEntry = copilotMarketplace.plugins.find((entry) => entry.name === copilot.name);

    assert(Boolean(claudePluginEntry), `Claude marketplace entry not found for ${copilot.name}`);
    assert(Boolean(copilotPluginEntry), `Copilot marketplace entry not found for ${copilot.name}`);

    assert(copilot.version === (claudePluginEntry as Marketplace["plugins"][number]).version, "Copilot and Claude marketplace plugin versions must match");
    assert(copilot.version === (copilotPluginEntry as Marketplace["plugins"][number]).version, "Copilot and Copilot marketplace plugin versions must match");

    assert(claudeMarketplace.name === copilotMarketplace.name, "Claude and Copilot marketplace names must match");
}

async function validateHookCommands(): Promise<void> {
    const copilotHooks = await readJson<{ hooks?: { preToolUse?: Array<{ command?: string }> } }>(joinPath(pluginRoot, "hooks.json"));
    const claudeHooks = await readJson<{ hooks?: { PreToolUse?: Array<{ hooks?: Array<{ command?: string }> }> } }>(joinPath(pluginRoot, "hooks", "hooks.claude.json"));
    const geminiHooks = await readJson<{ hooks?: { BeforeTool?: Array<{ hooks?: Array<{ command?: string }> }> } }>(joinPath(pluginRoot, "hooks", "hooks.gemini.json"));

    const copilotCommand = copilotHooks.hooks?.preToolUse?.[0]?.command || "";
    assert(copilotCommand.includes("node hooks/tool-guardian/guard-tool.mjs"), "Copilot hook must call Node guard tool");

    const claudeCommand = claudeHooks.hooks?.PreToolUse?.[0]?.hooks?.[0]?.command || "";
    assert(claudeCommand.includes("${CLAUDE_PLUGIN_ROOT}/hooks/tool-guardian/guard-tool.mjs"), "Claude hook must call guard tool via CLAUDE_PLUGIN_ROOT");

    const geminiCommand = geminiHooks.hooks?.BeforeTool?.[0]?.hooks?.[0]?.command || "";
    assert(geminiCommand.includes("${extensionPath}"), "Gemini hook must call guard tool via extensionPath variable");
}

async function validateSkillFrontmatter(): Promise<void> {
    const skillFiles = [
        joinPath(pluginRoot, "skills", "memory-bank", "SKILL.md"),
        joinPath(pluginRoot, "skills", "sequential-thinking", "SKILL.md")
    ];

    for (const skillFile of skillFiles) {
        const content = await Bun.file(skillFile).text();
        assert(content.startsWith("---"), `Skill frontmatter missing at ${relativePath(pluginRoot, skillFile)}`);
        assert(content.includes("description:"), `Skill description missing at ${relativePath(pluginRoot, skillFile)}`);
    }
}

async function run(): Promise<void> {
    await validateRequiredFiles();
    await validateManifestVersions();
    await validateHookCommands();
    await validateSkillFrontmatter();

    process.stdout.write("Multi-CLI validation passed.\n");
}

run().catch((error) => {
    process.stderr.write(`${errorMessage(error)}\n`);
    process.exit(1);
});
