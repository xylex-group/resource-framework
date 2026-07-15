import path from "node:path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";

const sharedUiModules = [
  "badge",
  "button",
  "card",
  "checkbox",
  "combo-box",
  "dialog",
  "input",
  "label",
  "number-field",
  "popover",
  "select",
  "separator",
  "skeleton",
  "switch",
  "textarea",
];
const sharedUiModuleIds = sharedUiModules.map((name) => `@/components/ui/${name}`);
const sharedUiAliases = sharedUiModules.map((name) => ({
  find: `@/components/ui/${name}`,
  replacement: path.resolve(process.cwd(), `components/ui/${name}.tsx`),
}));

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
        sourcemap: false,
        preserveModules: false
      },
      {
        dir: "dist",
        entryFileNames: "[name].cjs",
        format: "cjs",
        sourcemap: false,
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
      if (
        !sharedUiModuleIds.includes(id) &&
        hostPrefixes.some((prefix) => id.startsWith(prefix))
      ) {
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
        id.startsWith("class-variance-authority") ||
        id === "@xylex-group/athena" ||
        id.startsWith("@xylex-group/athena/") ||
        id.startsWith("@xylex-group/athena-auth-ui") ||
        id.startsWith("@heroui/") ||
        id.startsWith("papaparse") ||
        id === "md5"
      );
    },
    onwarn: (warning, warn) => {
      const isModuleDirective = warning.code === "MODULE_LEVEL_DIRECTIVE";
      const isUseClientDirective =
        typeof warning.message === "string" &&
        /["']use (client|server)["']/.test(warning.message);
      const isThirdPartyCircularDependency =
        warning.code === "CIRCULAR_DEPENDENCY" &&
        (
          (Array.isArray(warning.ids) &&
            warning.ids.length > 0 &&
            warning.ids.every(
              (id) => typeof id === "string" && id.includes("node_modules/")
            )) ||
          (typeof warning.message === "string" &&
            warning.message.includes("node_modules/"))
        );

      if (isModuleDirective && isUseClientDirective) {
        return;
      }
      if (isThirdPartyCircularDependency) {
        return;
      }

      warn(warning);
    },
    plugins: [
      alias({
        entries: [
          {
            find: "@/packages/resource-framework",
            replacement: path.resolve(process.cwd(), "."),
          },
          ...sharedUiAliases,
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

