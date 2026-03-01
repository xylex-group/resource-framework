import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@/lib/config",
        replacement: fileURLToPath(
          new URL("./apps/demo/src/lib/config.ts", import.meta.url),
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
