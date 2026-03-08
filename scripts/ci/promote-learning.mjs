#!/usr/bin/env node

import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

async function main() {
  const artifactDir = path.resolve(requiredArg("artifact-dir"));
  const cwd = path.resolve(args.cwd ?? process.cwd());
  const titleOverride = args["title-override"]?.trim();
  const extraTags = (args["extra-tags"] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const summary = JSON.parse(await fs.readFile(path.join(artifactDir, "ci-failure-raw.json"), "utf-8"));
  const markdown = await fs.readFile(path.join(artifactDir, "ci-learning.md"), "utf-8");

  const title = titleOverride ? titleOverride : buildTitle(summary);
  const tags = Array.from(new Set([
    "ci",
    "testing",
    "failure-learning",
    summary.framework,
    ...extraTags,
  ].filter(Boolean)));

  const content = [
    "Promoted from a CI failure artifact.",
    "",
    `- Workflow: ${summary.workflow}`,
    `- Job: ${summary.job}`,
    `- Event: ${summary.event}`,
    `- Ref: ${summary.ref}`,
    `- SHA: ${summary.sha}`,
    `- Run ID: ${summary.run_id}`,
    summary.run_url ? `- Run URL: ${summary.run_url}` : undefined,
    `- Failure signature: \`${summary.failure_signature}\``,
    `- Command: ${summary.command}`,
    "",
    markdown.trim(),
  ].filter(Boolean).join("\n");

  const embeddingServer = await startFakeEmbeddingServer();
  try {
    const response = await callLocalMcp(cwd, {
      title,
      content,
      tags,
      summary: `Promote CI failure learning for ${summary.primary_test_file}`,
      cwd,
      scope: "project",
    }, embeddingServer.url);

    process.stdout.write(`${response}\n`);
  } finally {
    await embeddingServer.close();
  }
}

function buildTitle(summary) {
  const source = summary.primary_test_file && summary.primary_test_file !== "unknown"
    ? summary.primary_test_file.replace(/^tests\//, "")
    : summary.failure_signature;
  return `CI failure lesson: ${source}`.slice(0, 120);
}

async function callLocalMcp(cwd, rememberArguments, ollamaUrl) {
  const messages = [
    {
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "ci-promote-learning", version: "1.0" },
      },
    },
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "remember",
        arguments: rememberArguments,
      },
    },
  ];

  const stdout = await new Promise((resolve, reject) => {
    const child = spawn("./scripts/mcp-local.sh", {
      cwd,
      env: {
        ...process.env,
        OLLAMA_URL: ollamaUrl,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`MCP promotion failed with ${code}: ${stderrData}`));
        return;
      }
      resolve(stdoutData);
    });

    child.stdin.end(messages.map((message) => JSON.stringify(message)).join("\n") + "\n");
  });

  const lines = stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const response = lines.find((line) => line.id === 1);
  const text = response?.result?.content?.[0]?.text;
  if (!text) {
    throw new Error("Missing remember response while promoting CI learning");
  }
  return text;
}

async function startFakeEmbeddingServer() {
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/api/embeddings") {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ embedding: [0.1, 0.2, 0.3] }));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine fake embedding server address");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    }),
  };
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function requiredArg(name) {
  const value = args[name];
  if (!value) {
    throw new Error(`Missing required argument --${name}`);
  }
  return value;
}
