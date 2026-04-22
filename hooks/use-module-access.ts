"use client";

import { businessConfig } from "@/config/business";
import { getDefaultModuleHref, getModuleKeyFromHref, getNavigationItems, platformModules } from "@/config/modules";
import { canAccessModuleByPermission } from "@/lib/permissions/ability";
import { useAuth } from "@/hooks/use-auth";

export function useModuleAccess() {
  const { workspace } = useAuth();
  const activeModuleKeys =
    workspace?.business.modules?.length && workspace.business.modules.length > 0
      ? workspace.business.modules
      : businessConfig.modules;
  const permissions = workspace?.permissions ?? [];

  const enabledModules = platformModules.filter(
    (module) => activeModuleKeys.includes(module.key) && canAccessModuleByPermission(module.key, permissions),
  );
  const enabledNavigation = getNavigationItems(activeModuleKeys, permissions);

  return {
    activeModuleKeys,
    enabledModules,
    enabledNavigation,
    defaultHref: getDefaultModuleHref(activeModuleKeys, permissions),
    isEnabled: (href: string) => {
      const key = getModuleKeyFromHref(href);
      return key ? activeModuleKeys.includes(key) && canAccessModuleByPermission(key, permissions) : true;
    },
  };
}
