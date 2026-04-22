import { describe, expect, it } from "vitest";

import {
  canAccessModuleByPermission,
  getPermissionsByRole,
  hasPermission,
  hasPermissionInSet,
} from "@/lib/permissions/ability";

describe("permission ability helpers", () => {
  it("returns the expected permission matrix for admin", () => {
    expect(getPermissionsByRole("admin")).toEqual([
      "view_reports",
      "manage_branding",
      "manage_settings",
      "manage_users",
      "manage_roles",
    ]);
  });

  it("grants owner every permission through manage_all", () => {
    expect(hasPermission("owner", "manage_roles")).toBe(true);
    expect(hasPermissionInSet(["manage_all"], "manage_branding")).toBe(true);
  });

  it("restricts protected modules when the required permission is missing", () => {
    expect(canAccessModuleByPermission("reports", [])).toBe(false);
    expect(canAccessModuleByPermission("users", ["manage_users"])).toBe(true);
    expect(canAccessModuleByPermission("customers", [])).toBe(true);
  });
});
