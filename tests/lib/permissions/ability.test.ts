import { describe, expect, it } from "vitest";

import {
  canAccessModuleByPermission,
  getPermissionsByRole,
  hasPermission,
  hasPermissionInSet,
} from "@/lib/permissions/ability";

describe("permission ability helpers", () => {
  it("returns the expected granular permission matrix for admin", () => {
    expect(getPermissionsByRole("admin")).toEqual(
      expect.arrayContaining([
        "reports.read",
        "branding.update",
        "settings.update",
        "users.manage",
        "roles.manage",
      ]),
    );
  });

  it("grants owner every permission through manage_all and accepts legacy aliases", () => {
    expect(hasPermission("owner", "roles.manage")).toBe(true);
    expect(hasPermissionInSet(["manage_all"], "branding.update")).toBe(true);
    expect(hasPermissionInSet(["manage_users"], "users.manage")).toBe(true);
    expect(hasPermissionInSet(["users.manage"], "manage_users")).toBe(true);
  });

  it("restricts protected modules when the required permission is missing", () => {
    expect(canAccessModuleByPermission("reports", [])).toBe(false);
    expect(canAccessModuleByPermission("users", ["users.read"])).toBe(true);
    expect(canAccessModuleByPermission("settings", ["manage_settings"])).toBe(true);
    expect(canAccessModuleByPermission("customers", [])).toBe(true);
  });
});
