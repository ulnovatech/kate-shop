#!/usr/bin/env node
/** Fix JSX after strip-admin-layout.mjs */
import fs from "node:fs";
import path from "node:path";

const routesDir = path.join(process.cwd(), "src", "routes");

function read(file) {
  return fs.readFileSync(path.join(routesDir, file), "utf8");
}

function write(file, s) {
  fs.writeFileSync(path.join(routesDir, file), s);
  console.log("fixed", file);
}

function fixPageLoader(s) {
  return s
    .replace(
      /return \(\s*\n(\s*)<PageLoader([\s\S]*?)\/>\s*\n\s+\);/g,
      "return (\n$1<PageLoader$2/>\n$1);",
    )
    .replace(
      /return \(\s*\n(\s*)<OrderDetailSkeleton\s*\/>\s*\n\s+\);/g,
      "return (\n$1<OrderDetailSkeleton />\n$1);",
    );
}

function removeStrayFragmentClose(s) {
  return s
    .replace(/(<\/section>)\n    <\/>\n  \);/g, "$1\n  );")
    .replace(/(<\/form>)\n    <\/>\n  \);/g, "$1\n  );");
}

function closeFragmentBefore(s, anchor) {
  if (!s.includes(anchor)) return s;
  return s.replace(new RegExp(`(${escapeRe(anchor)})\\n      \\);\\n\\}`), "$1\n    </>\n  );\n}");
}

function wrapMultiRootReturn(s, firstLine, anchor) {
  if (s.includes("return (\n    <>")) return s;
  s = s.replace(`  return (\n${firstLine}`, `  return (\n    <>\n${firstLine}`);
  return closeFragmentBefore(s, anchor);
}

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const closeFragmentFiles = [
  ["admin.index.tsx", "        ) : null}"],
  ["admin.insights.tsx", "        ) : null}"],
  ["admin.audit.tsx", "        </div>"],
  ["admin.notifications.tsx", "        </div>"],
  ["admin.orders.$id.tsx", "        </div>"],
  ["admin.products.$id.tsx", "        </div>"],
  ["admin.products.new.tsx", "        </div>"],
  ["admin.recycle.tsx", "        </div>"],
  ["admin.team.tsx", "        </div>"],
  ["admin.settings.tsx", "        </div>"],
  ["admin.payments.tsx", "        </div>"],
  ["admin.delivery.tsx", "        </div>"],
];

for (const [file, anchor] of closeFragmentFiles) {
  let s = read(file);
  s = fixPageLoader(s);
  s = removeStrayFragmentClose(s);
  s = closeFragmentBefore(s, anchor);
  write(file, s);
}

const wrapFiles = [
  [
    "admin.orders.tsx",
    '    <div className="flex flex-wrap items-start justify-between gap-4">',
    "        </div>",
  ],
  [
    "admin.payment-methods.tsx",
    '    <div className="flex flex-wrap items-start justify-between gap-4">',
    "        )}",
  ],
  [
    "admin.products.index.tsx",
    '    <div className="flex flex-wrap items-center justify-between gap-4">',
    "        </div>",
  ],
  [
    "admin.roles.tsx",
    '    <div className="flex flex-wrap items-start justify-between gap-4">',
    "        </div>",
  ],
];

for (const [file, firstLine, anchor] of wrapFiles) {
  let s = read(file);
  s = fixPageLoader(s);
  s = wrapMultiRootReturn(s, firstLine, anchor);
  write(file, s);
}

// payment-methods: anchor might be wrong - last closing is `        )}` for ternary
let pm = read("admin.payment-methods.tsx");
if (!pm.includes("    </>\n  );")) {
  pm = pm.replace(/\n        \)\}\n      \);\n\}/, "\n        )}\n    </>\n  );\n}");
  write("admin.payment-methods.tsx", pm);
}

// products.index - anchor at very end
let pi = read("admin.products.index.tsx");
if (!pi.includes("    </>\n  );\n}")) {
  pi = pi.replace(/\n        <\/div>\n      \);\n\}\n*$/, "\n        </div>\n    </>\n  );\n}");
  write("admin.products.index.tsx", pi);
}

// roles - close at end of grid
let roles = read("admin.roles.tsx");
if (!roles.includes("    </>\n  );\n}")) {
  roles = roles.replace(
    /\n        <\/div>\n      \);\n\}\n*$/,
    "\n        </div>\n    </>\n  );\n}",
  );
  write("admin.roles.tsx", roles);
}

// orders - close at end
let orders = read("admin.orders.tsx");
if (!orders.includes("    </>\n  );\n}")) {
  orders = orders.replace(
    /\n        <\/div>\n      \);\n\}\n*$/,
    "\n        </div>\n    </>\n  );\n}",
  );
  write("admin.orders.tsx", orders);
}
