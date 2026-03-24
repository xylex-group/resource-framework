import { spawnSync } from "node:child_process";

const tscCommand = process.execPath;
const tscEntrypoint = "node_modules/typescript/bin/tsc";

const checks = [
  {
    label: "package",
    command: tscCommand,
    args: [tscEntrypoint, "-p", "tsconfig.package.json", "--noEmit", "--pretty", "false"],
  },
  {
    label: "demo-app",
    command: tscCommand,
    args: [tscEntrypoint, "-p", "apps/demo/tsconfig.json", "--noEmit", "--pretty", "false"],
  },
  {
    label: "playground-app",
    command: tscCommand,
    args: [tscEntrypoint, "-p", "apps/playground-next/tsconfig.json", "--noEmit", "--pretty", "false"],
  },
];

const failures = [];

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    if (result.error) {
      console.error(`[${check.label}] ${result.error.message}`);
    }
    failures.push(check.label);
  }
}

if (failures.length > 0) {
  console.error(`Typecheck failed for: ${failures.join(", ")}`);
  process.exit(1);
}
