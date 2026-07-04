#!/usr/bin/env node
/**
 * Chunk 18 — smoke-test /health.json (CI or post-deploy).
 * Usage: node scripts/health-check.mjs [url]
 */
const url = process.argv[2] ?? "http://localhost:8080/health.json";

async function main() {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const body = await res.text();

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    console.error(`Health check failed: non-JSON response (${res.status})`);
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`Health check failed: HTTP ${res.status}`, json);
    process.exit(1);
  }

  if (json.status === "unhealthy") {
    console.error("Health check unhealthy:", json);
    process.exit(1);
  }

  console.log(`Health OK (${json.status}):`, json.checks);
}

main().catch((err) => {
  console.error("Health check error:", err.message ?? err);
  process.exit(1);
});
