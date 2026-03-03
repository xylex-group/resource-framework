import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@xylex-group\/resource-framework\/(.*)$/,
        replacement: `${rootDir}$1`,
      },
      {
        find: "@xylex-group/resource-framework",
        replacement: fileURLToPath(new URL("./index.ts", import.meta.url)),
      },
      {
        find: "@/packages/resource-framework",
        replacement: rootDir,
      },
      {
        find: "@/components",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components", import.meta.url),
        ),
      },
      {
        find: "@/lib/config",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/lib/config.ts", import.meta.url),
        ),
      },
      {
        find: "@/lib",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/lib", import.meta.url),
        ),
      },
      {
        find: "@/hooks",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/hooks", import.meta.url),
        ),
      },
      {
        find: "@/layouts",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components/layouts", import.meta.url),
        ),
      },
      {
        find: "@/select",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components/select", import.meta.url),
        ),
      },
      {
        find: "@/json",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components/json", import.meta.url),
        ),
      },
      {
        find: "@/tabs",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components/tabs", import.meta.url),
        ),
      },
      {
        find: "@/filters",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components/filters", import.meta.url),
        ),
      },
      {
        find: "@/inputs",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components/inputs", import.meta.url),
        ),
      },
      {
        find: "@/ui",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/components/ui", import.meta.url),
        ),
      },
      {
        find: "@/lib/stores",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/lib/stores.ts", import.meta.url),
        ),
      },
      {
        find: "@",
        replacement: rootDir,
      },
    ],
  },
  test: {
    environment: "node",
  },
});
