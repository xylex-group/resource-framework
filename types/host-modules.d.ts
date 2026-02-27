declare module "@/lib/*" {
  const content: any;
  export default content;
}

declare module "@/components/*" {
  const content: any;
  export default content;
}

declare module "@/hooks/*" {
  const content: any;
  export default content;
}

declare module "@/layouts/*" {
  const content: any;
  export default content;
}

declare module "@/select/*" {
  const content: any;
  export default content;
}

declare module "@/json/*" {
  const content: any;
  export default content;
}

declare module "@/tabs/*" {
  const content: any;
  export default content;
}

declare module "@/filters/*" {
  const content: any;
  export default content;
}

declare module "@/inputs/*" {
  const content: any;
  export default content;
}

declare module "@/ui/*" {
  const content: any;
  export default content;
}

declare module "@/notifications" {
  const content: any;
  export default content;
}

declare module "@/lib/types" {
  export type EditorConfig = {
    type?: string;
    options?: { label: string; value: string }[];
    update_column?: string;
    data_source?: string;
    update_table?: string;
    update_id_column?: string;
  };
  export type ColumnConfigObject = {
    column_name: string;
    hidden?: boolean;
    cell_value_mask_label?: string;
    editable?: EditorConfig;
    [key: string]: unknown;
  };
  export type ColumnConfiguration = ColumnConfigObject;
  export type ResourceData = Record<string, unknown>;
  export type DataSourceConfig = {
    table: string;
    value_column?: string;
    label_column?: string;
    order_by?: string;
    limit?: number;
  } | string;
  export type SelectOption = { label: string; value: string | number | boolean };
  export type FormStateData = Record<string, unknown>;
  export type EditorConfig = Record<string, unknown>;
}

declare module "@/lib/config" {
  export const APP_CONFIG: {
    api: {
      suitsbooks: string;
      events_dms: string;
    };
  };
  export const S3_CLIENT_CONFIG: {
    bucket: string;
    region: string;
  };
}

declare module "@/lib/utils" {
  export function cn(...args: Array<string | false | null | undefined>): string;
}

declare module "@/lib/date-utils" {
  export function formatUnixSecondsToDate(value: number): string;
  export function formatUnixSecondsToMonthDayTime(value: number): string;
}

declare module "@/lib/actions/data" {
  export type DataCondition = {
    eq_column: string;
    eq_value: string | number | boolean | null;
  };
  export type Response<T = unknown> = {
    data: T | null;
    error: string | null;
  };
  export function fetchData(
    params: {
      table_name: string;
      schema?: string;
      conditions?: DataCondition[];
      columns?: string[];
      limit?: number;
      offset?: number;
      order_by?: string;
    },
  ): Promise<Response<unknown[]>>;
  export function insertData(params: {
    table_name: string;
    schema?: string;
    insert_body: Record<string, unknown> | Record<string, unknown>[];
    columns?: string[];
  }): Promise<Response<unknown>>;
  export function updateData(params: {
    table_name: string;
    schema?: string;
    x_column?: string;
    x_id?: string | number;
    update_body?: Record<string, unknown>;
    limit?: number;
  }): Promise<Response<unknown>>;
  export function deleteData(params: {
    table_name: string;
    schema?: string;
    x_column?: string;
    x_id?: string | number;
    update_body?: Record<string, unknown>;
  }): Promise<Response<unknown>>;
}

declare module "@/lib/format/string" {
  export function prettyString(value: string): string;
  export function pluralize(
    singular: string,
    plural: string,
    count: number,
  ): string;
}

declare module "next/navigation" {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
  };
  export function useSearchParams(): URLSearchParams;
  export function usePathname(): string;
  export function useParams<T = Record<string, string>>(): T;
}

declare module "@/lib/zustand" {
  export type DisplaySettings = Record<string, Record<string, unknown>>;
  export type DisplayConfigOption = {
    type?: "toggle" | "group" | "rows_per_page" | string;
    label: string;
    value: string;
    defaultValue?: string | number | boolean;
    options?: { label: string; value: string }[];
  };
  export type StylingState = {
    tables_extra_side_padding?: boolean;
  };
  export type ViewState = {
    view: {
      display_settings: DisplaySettings;
      sidebarRoute: string | null;
      isInLightbox: boolean;
      isInPopover: boolean;
      isInUserPopover: boolean;
      styling: StylingState;
    };
    setDisplaySetting: (context: string, key: string, value: unknown) => void;
    getDisplaySetting: (context: string, key: string) => unknown;
    resetDisplaySettings: (context: string) => void;
    setSidebarRoute: (route: string | null) => void;
    setIsInLightbox: (value: boolean) => void;
    setIsInPopover: (value: boolean) => void;
    setIsInUserPopover: (value: boolean) => void;
    setStyling: (styling: StylingState) => void;
    setDebugMode: (value: boolean) => void;
    setDebugMode: (value: boolean) => void;
  };

  export function useViewStore(): ViewState;
}

declare module "@/lib/zustand/useViewStore" {
  export type DisplayConfigOption = {
    type?: "toggle" | "group" | "rows_per_page" | string;
    label: string;
    value: string;
    defaultValue?: string | number | boolean;
    options?: { label: string; value: string }[];
  };
  export type StylingState = {
    tables_extra_side_padding?: boolean;
  };
  export { useViewStore } from "@/lib/zustand";
}

declare module "@/components/ui/dialog" {
  import type { HTMLAttributes, ReactNode } from "react";

  type DialogProps = {
    children?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  } & HTMLAttributes<HTMLDivElement>;

type DialogPartProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  forceFullScreen?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
};

  export const Dialog: React.ComponentType<DialogProps>;
  export const DialogContent: React.ComponentType<DialogPartProps>;
  export const DialogOverlay: React.ComponentType<DialogPartProps>;
  export const DialogPortal: React.ComponentType<DialogPartProps>;
  export const DialogTitle: React.ComponentType<DialogPartProps>;
}

declare module "@/components/ui/alert-dialog" {
  import type { HTMLAttributes, ReactNode } from "react";

  type AlertDialogPartProps = HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
  };

  type AlertDialogButtonProps = HTMLAttributes<HTMLButtonElement> & {
    children?: ReactNode;
  };

  type AlertDialogTriggerProps = AlertDialogButtonProps & {
    asChild?: boolean;
  };

  export const AlertDialog: React.ComponentType<{ children: ReactNode }>;
  export const AlertDialogTrigger: React.ComponentType<AlertDialogTriggerProps>;
  export const AlertDialogContent: React.ComponentType<AlertDialogPartProps>;
  export const AlertDialogDescription: React.ComponentType<AlertDialogPartProps>;
  export const AlertDialogHeader: React.ComponentType<AlertDialogPartProps>;
  export const AlertDialogFooter: React.ComponentType<AlertDialogPartProps>;
  export const AlertDialogTitle: React.ComponentType<AlertDialogPartProps>;
  export const AlertDialogCancel: React.ComponentType<AlertDialogButtonProps>;
  export const AlertDialogAction: React.ComponentType<AlertDialogButtonProps>;
}

declare module "@/components/ui-responsive/responsive-dropdown-v2" {
  import type { ReactElement } from "react";

  export type ResponsiveDropdownItem = {
    buttonText?: string;
    onClick?: () => void;
    type?: "separator";
    variant?: "default" | "destructive";
    disabled?: boolean;
  };

  export interface ResponsiveDropdownV2Props {
    dropdownLabel?: string;
    items: ResponsiveDropdownItem[];
    triggerButton?: ReactElement;
  }

  export function ResponsiveDropdownV2(
    props: ResponsiveDropdownV2Props,
  ): React.ReactElement;
}

declare module "@/components/ui/container" {
  import type { HTMLAttributes, ReactNode } from "react";
  export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
    isExtraPaddingEnabled?: boolean;
    children?: ReactNode;
  };
  export const Container: React.ComponentType<ContainerProps>;
}

declare module "@/hooks/use-user-scopes" {
  export type UserScopeRecord = Record<string, unknown>;
  export function useUserScopes(options?: {
    cache_enabled?: boolean;
  }): {
    hasScope: (scope: string | string[]) => boolean;
  };
}

declare module "@/hooks/use-notifications" {
  export interface NotificationOptions {
    message: string;
    success?: boolean;
  }
  export type UseNotificationOptions = NotificationOptions;
  export function useNotification(): {
    notification: (options: NotificationOptions) => void;
  };
}

declare module "@/hooks/use-toast" {
  export type ToastOptions = {
    title?: string;
    description?: string;
    variant?: "success" | "destructive" | string;
  };
  export function useToast(): {
    toast: (options: ToastOptions) => void;
  };
}

declare module "@/components/icons" {
  export const PriorityIcon: any;
  export const InformationIcon: any;
}

declare module "@/drizzle/schema" {
  const schema: Record<string, unknown>;
  export { schema };
}
