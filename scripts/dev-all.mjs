#!/usr/bin/env node
/**
 * Start all Kate Shop dev servers in parallel:
 *   - Storefront (standalone)     http://localhost:5173
 *   - Admin (standalone)          http://localhost:5174
 *   - Monolith (shop + /admin)    http://localhost:5175
 */
import { spawn } from "node:child_process";

const SERVICES = [
  {
    key: "storefront",
    args: ["run", "dev", "-w", "@kate/storefront"],
    url: "http://localhost:5173",
    hint: "Customer storefront",
  },
  {
    key: "admin",
    args: ["run", "dev", "-w", "@kate/admin"],
    url: "http://localhost:5174",
    hint: "Standalone Kate Admin",
  },
  {
    key: "monolith",
    args: ["run", "dev:monolith"],
    url: "http://localhost:5175",
    hint: "Legacy monolith — shop at /, staff at /admin",
  },
];

const isWin = process.platform === "win32";
const npmCmd = "npm";
const children = [];

const COLORS = {
  storefront: "\x1b[34m",
  admin: "\x1b[32m",
  monolith: "\x1b[35m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

console.log(`
${COLORS.bold}Kate Shop — dev (all apps)${COLORS.reset}
${SERVICES.map((s) => `  ${s.key.padEnd(11)} ${s.url.padEnd(28)} ${s.hint}`).join("\n")}
`);

for (const svc of SERVICES) {
  const child = spawn(npmCmd, svc.args, {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWin,
  });

  const tag = `${COLORS[svc.key]}[${svc.key}]${COLORS.reset}`;
  const prefixLines = (chunk, stream) => {
    const text = chunk.toString();
    for (const line of text.split(/\r?\n/)) {
      if (!line.length) continue;
      stream.write(`${tag} ${line}\n`);
    }
  };

  child.stdout?.on("data", (chunk) => prefixLines(chunk, process.stdout));
  child.stderr?.on("data", (chunk) => prefixLines(chunk, process.stderr));

  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`${tag} exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
}

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (isWin) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill("SIGTERM");
      }
    }
  }

  setTimeout(() => process.exit(code), 400);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
