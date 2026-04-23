import { describe, expect, it } from "vitest";

import { normalizePermissionKeys } from "@/lib/permissions/catalog";

describe("permission catalog normalization", () => {
  it("adds read permissions when operational write permissions are selected", () => {
    expect(normalizePermissionKeys(["customers.create", "sales.update"])).toEqual([
      "customers.read",
      "customers.create",
      "sales.read",
      "sales.update",
    ]);
  });

  it("adds read permissions for management permissions", () => {
    expect(normalizePermissionKeys(["users.manage", "branding.update"])).toEqual([
      "users.read",
      "users.manage",
      "branding.read",
      "branding.update",
    ]);
  });
});
