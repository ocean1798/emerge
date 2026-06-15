#!/usr/bin/env node
import { spawn } from "node:child_process";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const serverDir = path.join(rootDir, "server");
const npmCommand = "npm";
const windowsShell = process.env.ComSpec || "cmd.exe";
const appUrl = "http://127.0.0.1:5173/";
const apiUrl = "http://127.0.0.1:8787/api/health";
const args = new Set(process.argv.slice(2));
const children = [];

function printHelp() {
  console.log(`Emerge local dev runner

Usage:
  npm run dev          Start local API and frontend together
  npm run dev:check    Verify both local services are reachable

Notes:
  Running npm run dev inside app/ also delegates here, so the API starts too.

URLs:
  App: ${appUrl}
  API: ${apiUrl}
`);
}

async function isReachable(url, timeoutMs = 900) {
  return new Promise((resolve) => {
    const target = new URL(url);
    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request(
      target,
      {
        method: "GET",
        timeout: timeoutMs,
      },
      (response) => {
        response.resume();
        response.on("end", () => {
          resolve((response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 400);
        });
      },
    );
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
    request.end();
  });
}

async function waitForUrl(name, url, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isReachable(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${name} did not become reachable: ${url}`);
}

function prefixOutput(name, stream, target) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) target.write(`[${name}] ${line}\n`);
    }
  });
}

function startProcess(name, cwd, commandArgs, extraEnv = {}) {
  const command =
    process.platform === "win32" ? windowsShell : npmCommand;
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `${npmCommand} ${commandArgs.join(" ")}`]
      : commandArgs;
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...extraEnv },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  children.push(child);
  prefixOutput(name, child.stdout, process.stdout);
  prefixOutput(name, child.stderr, process.stderr);
  child.on("exit", (code) => {
    if (code && !isShuttingDown) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

let isShuttingDown = false;
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

if (args.has("--help") || args.has("-h")) {
  printHelp();
  process.exit(0);
}

if (args.has("--check")) {
  const [apiReady, appReady] = await Promise.all([
    isReachable(apiUrl),
    isReachable(appUrl),
  ]);
  console.log(`API ${apiReady ? "OK" : "DOWN"} ${apiUrl}`);
  console.log(`App ${appReady ? "OK" : "DOWN"} ${appUrl}`);
  process.exit(apiReady && appReady ? 0 : 1);
}

const [apiAlreadyRunning, appAlreadyRunning] = await Promise.all([
  isReachable(apiUrl),
  isReachable(appUrl),
]);

if (apiAlreadyRunning) {
  console.log(`API already running: ${apiUrl}`);
} else {
  startProcess("api", serverDir, ["run", "dev"]);
}

if (appAlreadyRunning) {
  console.log(`App already running: ${appUrl}`);
} else {
  startProcess("app", appDir, ["run", "dev:vite"], {
    EMERGE_VITE_AUTOSTART_API: "0",
  });
}

await Promise.all([
  waitForUrl("API", apiUrl),
  waitForUrl("App", appUrl),
]);

console.log("");
console.log("Emerge local dev is ready.");
console.log(`App: ${appUrl}`);
console.log(`API: ${apiUrl}`);

if (children.length === 0) {
  console.log("Both services were already running.");
  process.exit(0);
}
