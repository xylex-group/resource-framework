import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

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
    requiredPaths: [
      "apps/demo/node_modules/next/package.json",
      "apps/demo/node_modules/@base-ui/react/package.json",
      "apps/demo/node_modules/next-themes/package.json",
    ],
  },
  {
    label: "playground-app",
    command: tscCommand,
    args: [tscEntrypoint, "-p", "apps/playground-next/tsconfig.json", "--noEmit", "--pretty", "false"],
    requiredPaths: [
      "apps/playground-next/node_modules/next/package.json",
      "apps/demo/node_modules/@base-ui/react/package.json",
      "apps/demo/node_modules/next-themes/package.json",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const missingDependencies = (check.requiredPaths ?? []).filter((path) =>
    !existsSync(path)
  );

  if (missingDependencies.length > 0) {
    console.warn(
      `[${check.label}] skipped typecheck because required dependencies are missing.`,
    );
    continue;
  }

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
