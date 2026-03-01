import { spawnSync } from "node:child_process";

const checks = [
  {
    label: "package",
    command: "npx",
    args: ["tsc", "-p", "tsconfig.package.json", "--noEmit", "--pretty", "false"],
  },
  {
    label: "demo-app",
    command: "npx",
    args: ["tsc", "-p", "apps/demo/tsconfig.json", "--noEmit", "--pretty", "false"],
  },
  {
    label: "playground-app",
    command: "npx",
    args: ["tsc", "-p", "apps/playground-next/tsconfig.json", "--noEmit", "--pretty", "false"],
  },
];

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(`Typecheck failed for ${check.label}.`);
    process.exit(result.status ?? 1);
  }
}
