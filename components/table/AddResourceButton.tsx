import type { ResourceCreateConfig, ResourceRoute } from "../../resource-types";

interface User {
  user_id: string;
  company_id: string;
  organization_id: string;
  [key: string]: unknown;
}

/**
 * Hook to manage add resource button behavior and permissions
 * @param resourceName - Name of the resource
 * @param resource - Resource route configuration
 * @param user - Current user object
 * @param hasScope - Function to check user scopes
 * @param notification - Notification function
 * @param setCreateOpen - Function to control create dialog state
 * @returns Object containing button props and permission flags
 */
export const useAddResourceButton = (
  resourceName: string | undefined,
  resource: ResourceRoute | null,
  user: User | null,
  hasScope: (scope: string | string[]) => boolean,
  notification: (opts: { message: string; success: boolean }) => void,
  setCreateOpen: (open: boolean) => void,
) => {
  const createCfg: ResourceCreateConfig | null = resource?.create || null;
  const createScope = Array.isArray(createCfg?.scope)
    ? (createCfg.scope as string[])
    : createCfg?.scope
    ? [String(createCfg.scope)]
    : [];

  const showButtonScope = Array.isArray(createCfg?.showButtonScope)
    ? (createCfg.showButtonScope as string[])
    : createCfg?.showButtonScope
    ? [String(createCfg.showButtonScope)]
    : createScope;

  const canSeeCreate = createCfg ? hasScope(showButtonScope) : false;
  const canCreate = createCfg ? hasScope(createScope) : false;

  const addResourceProps: {
    addResourceLabel?: string;
    onAddResourceButton?: () => void;
    addResourceButton?: React.ReactNode;
  } = {};

  return {
    addResourceProps,
    createCfg,
    canSeeCreate,
    canCreate,
  };
};
