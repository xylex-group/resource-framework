declare module "next/navigation" {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
  };
  export function useSearchParams(): URLSearchParams;
  export function usePathname(): string;
  export function useParams<T = Record<string, string>>(): T;
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

declare module "@/drizzle/schema" {
  const schema: Record<string, unknown>;
  export { schema };
}
