import path from "node:path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";

/** @type {import('rollup').RollupOptions[]} */
const configs = [
  {
    input: {
      index: "index.ts",
      "adapters/index": "adapters/index.ts",
      "components/index": "components/index.ts"
    },
    output: [
      {
        dir: "dist",
        entryFileNames: "[name].js",
        format: "esm",
        sourcemap: true,
        preserveModules: false
      },
      {
        dir: "dist",
        entryFileNames: "[name].cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named",
        preserveModules: false
      }
    ],
    external: (id) => {
      const hostPrefixes = [
        "@/components",
        "@/lib",
        "@/hooks",
        "@/layouts",
        "@/select",
        "@/json",
        "@/tabs",
        "@/filters",
        "@/inputs",
        "@/ui",
        "@/notifications",
      ];
      if (hostPrefixes.some((prefix) => id.startsWith(prefix))) {
        return true;
      }
      return (
        id.startsWith("react") ||
        id.startsWith("@tanstack/react-table") ||
        id.startsWith("date-fns") ||
        id.startsWith("lucide-react") ||
        id.startsWith("next/navigation") ||
        id.startsWith("@bprogress/core") ||
        id.startsWith("motion/react") ||
        id.startsWith("drizzle-orm") ||
        id.startsWith("papaparse") ||
        id === "md5"
      );
    },
    plugins: [
      alias({
        entries: [
          {
            find: "@/packages/resource-framework",
            replacement: path.resolve(process.cwd(), "."),
          },
          {
            find: "@/drizzle",
            replacement: path.resolve(process.cwd(), "drizzle"),
          },
          {
            find: "@/components",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components"),
          },
          {
            find: "@/lib",
            replacement: path.resolve(process.cwd(), "apps/demo/src/lib"),
          },
          {
            find: "@/hooks",
            replacement: path.resolve(process.cwd(), "apps/demo/src/hooks"),
          },
          {
            find: "@/layouts",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components/layouts"),
          },
          {
            find: "@/select",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components/select"),
          },
          {
            find: "@/json",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components/json"),
          },
          {
            find: "@/tabs",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components/tabs"),
          },
          {
            find: "@/filters",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components/filters"),
          },
          {
            find: "@/inputs",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components/inputs"),
          },
          {
            find: "@/ui",
            replacement: path.resolve(process.cwd(), "apps/demo/src/components/ui"),
          },
        ],
      }),
      resolve({
        extensions: [".mjs", ".js", ".json", ".node", ".ts", ".tsx"]
      }),
      commonjs(),
      typescript({
        tsconfig: path.resolve(process.cwd(), "tsconfig.rollup.json"),
        declaration: false
      })
    ]
  }
];

export default configs;


