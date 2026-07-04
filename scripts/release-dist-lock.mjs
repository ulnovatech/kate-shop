#!/usr/bin/env node
/** Stop local wrangler/workerd so Vite can clear the storefront dist folder on Windows. */
import { spawnSync } from "node:child_process";

export function releaseDistLock() {
  if (process.platform !== "win32") return;

  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      "Get-Process workerd -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; " +
        "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | " +
        "Where-Object { $_.CommandLine -match 'wrangler' } | " +
        "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
    ],
    { stdio: "ignore", shell: true },
  );
}
