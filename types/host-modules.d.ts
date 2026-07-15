declare module "next/navigation" {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
  };
  export function useSearchParams(): URLSearchParams;
  export function usePathname(): string;
  export function useParams<T = Record<string, string>>(): T;
  export function notFound(): never;
}

declare module "next/link" {
  import type { ComponentProps, ReactElement, ReactNode } from "react";

  export type LinkProps = ComponentProps<"a"> & {
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
    children?: ReactNode;
  };

  const Link: (props: LinkProps) => ReactElement;
  export default Link;
}

declare module "next-themes" {
  import type { ComponentType, ReactNode } from "react";

  export const ThemeProvider: ComponentType<{
    children?: ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
  }>;

  export function useTheme(): {
    theme?: string;
    setTheme: (theme: string) => void;
  };
}

declare module "@bprogress/core" {
  export const BProgress: {
    start: () => void;
    done: () => void;
  };
}

declare module "motion/react" {
  import type { ComponentType, ReactNode } from "react";

  export const AnimatePresence: ComponentType<{
    children?: ReactNode;
    mode?: string;
    initial?: boolean;
  }>;

  export const motion: Record<string, ComponentType<any>>;
}

declare module "class-variance-authority" {
  export function cva(base?: string, config?: unknown): (...args: unknown[]) => string;
  export type VariantProps<T> = Record<string, unknown>;
}
