import { describe, expect, it } from "vitest";

import { getDefaultModuleHref, getModuleKeyFromHref, getNavigationItems } from "@/config/modules";

describe("module navigation config", () => {
  it("maps hrefs back to module keys", () => {
    expect(getModuleKeyFromHref("/dashboard")).toBe("dashboard");
    expect(getModuleKeyFromHref("/missing")).toBeNull();
  });

  it("filters navigation by enabled modules and permissions", () => {
    const navigation = getNavigationItems(["dashboard", "reports", "users"], ["manage_users"]);

    expect(navigation.map((item) => item.href)).toEqual(["/dashboard", "/users"]);
  });

  it("picks the first allowed route as default", () => {
    expect(getDefaultModuleHref(["reports", "users"], ["manage_users"])).toBe("/users");
    expect(getDefaultModuleHref(["reports"], ["view_reports"])).toBe("/reports");
  });
});
