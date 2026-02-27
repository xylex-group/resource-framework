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


