#!/usr/bin/env node
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const serverDir = path.join(rootDir, "server");
const apiUrl = "http://127.0.0.1:8787/api/health";
const npmCommand = "npm";
const windowsShell = process.env.ComSpec || "cmd.exe";
const children = [];
let isShuttingDown = false;

function npmArgs(commandArgs) {
  return process.platform === "win32"
    ? ["/d", "/s", "/c", `${npmCommand} ${commandArgs.join(" ")}`]
    : commandArgs;
}

function commandForPlatform() {
  return process.platform === "win32" ? windowsShell : npmCommand;
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

function startProcess(name, cwd, commandArgs) {
  const child = spawn(commandForPlatform(), npmArgs(commandArgs), {
    cwd,
    env: process.env,
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

function isReachable(url, timeoutMs = 900) {
  return new Promise((resolve) => {
    const request = http.request(
      url,
      {
        method: "GET",
        timeout: timeoutMs,
      },
      (response) => {
        response.resume();
        response.on("end", () => {
          const statusCode = response.statusCode ?? 500;
          resolve(statusCode >= 200 && statusCode < 400);
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

if (process.env.EMERGE_VITE_AUTOSTART_API !== "0" && !(await isReachable(apiUrl))) {
  startProcess("api", serverDir, ["run", "dev"]);
}

const extraArgs = process.argv.slice(2);
const viteArgs =
  extraArgs.length > 0
    ? ["exec", "vite", "--", ...extraArgs]
    : ["exec", "vite", "--", "--host", "127.0.0.1", "--port", "5173"];
const vite = startProcess("app", appDir, viteArgs);
vite.on("exit", (code) => {
  shutdown();
  process.exit(code ?? 0);
});
