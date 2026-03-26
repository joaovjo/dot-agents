#!/usr/bin/env bun

import { $ } from "bun";

const rootDir = process.cwd();
const pluginDir = `${rootDir}/plugins/nexus-orchestrator`;
const distDir = `${rootDir}/dist`;

function parentDir(filePath: string): string {
    const normalizedPath = filePath.replaceAll("\\", "/");
    const lastSlashIndex = normalizedPath.lastIndexOf("/");
    return lastSlashIndex > 0 ? normalizedPath.slice(0, lastSlashIndex) : ".";
}

async function cleanDirectory(targetPath: string): Promise<void> {
    await $`rm -rf ${targetPath}`;
    await $`mkdir -p ${targetPath}`;
}

async function copyPath(sourceRelative: string, targetAbsolute: string): Promise<void> {
    const sourceAbsolute = `${pluginDir}/${sourceRelative}`;
    await $`mkdir -p ${parentDir(targetAbsolute)}`;
    await $`cp -R ${sourceAbsolute} ${targetAbsolute}`;
}

async function writeJson(targetPath: string, json: unknown): Promise<void> {
    await $`mkdir -p ${parentDir(targetPath)}`;
    await Bun.write(targetPath, `${JSON.stringify(json, null, 2)}\n`);
}

async function readJson<T>(sourceRelative: string): Promise<T> {
    return (await Bun.file(`${pluginDir}/${sourceRelative}`).json()) as T;
}

async function buildCopilot(): Promise<void> {
    const output = `${distDir}/nexus-orchestrator-copilot`;
    await cleanDirectory(output);

    await copyPath(".plugin", `${output}/.plugin`);
    await copyPath("agents", `${output}/agents`);
    await copyPath("skills", `${output}/skills`);
    await copyPath("commands", `${output}/commands`);
    await copyPath("hooks/tool-guardian", `${output}/hooks/tool-guardian`);
    await copyPath("hooks.json", `${output}/hooks.json`);
    await copyPath("README.md", `${output}/README.md`);
}

async function buildGemini(): Promise<void> {
    const output = `${distDir}/nexus-orchestrator-gemini`;
    await cleanDirectory(output);

    await copyPath("agents", `${output}/agents`);
    await copyPath("skills", `${output}/skills`);
    await copyPath("commands", `${output}/commands`);
    await copyPath("hooks/tool-guardian", `${output}/hooks/tool-guardian`);
    await copyPath("GEMINI.md", `${output}/GEMINI.md`);
    await copyPath("README.md", `${output}/README.md`);
    await copyPath("gemini-extension.json", `${output}/gemini-extension.json`);

    const geminiHooks = await readJson<unknown>("hooks/hooks.gemini.json");
    await writeJson(`${output}/hooks/hooks.json`, geminiHooks);
}

async function buildClaude(): Promise<void> {
    const output = `${distDir}/nexus-orchestrator-claude`;
    await cleanDirectory(output);

    await copyPath(".claude-plugin", `${output}/.claude-plugin`);
    await copyPath("agents", `${output}/agents`);
    await copyPath("skills", `${output}/skills`);
    await copyPath("commands", `${output}/commands`);
    await copyPath("hooks/tool-guardian", `${output}/hooks/tool-guardian`);
    await copyPath("README.md", `${output}/README.md`);

    const claudeHooks = await readJson<unknown>("hooks/hooks.claude.json");
    await writeJson(`${output}/hooks/hooks.json`, claudeHooks);

    const claudeManifest = await readJson<Record<string, unknown>>(".claude-plugin/plugin.json");
    claudeManifest.hooks = "./hooks/hooks.json";
    await writeJson(`${output}/.claude-plugin/plugin.json`, claudeManifest);
}

async function run(): Promise<void> {
    await $`mkdir -p ${distDir}`;
    await buildCopilot();
    await buildGemini();
    await buildClaude();

    process.stdout.write("Built dist artifacts for Copilot, Gemini, and Claude.\n");
}

run().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
