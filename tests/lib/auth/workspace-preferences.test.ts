import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearPreferredBusinessId,
  persistPreferredBusinessId,
  readPreferredBusinessId,
} from "@/lib/auth/workspace-preferences";

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("workspace preferences", () => {
  it("persists, reads and clears the preferred business id in localStorage", () => {
    vi.stubGlobal("window", {
      localStorage: createLocalStorageMock(),
    });

    expect(readPreferredBusinessId()).toBeNull();

    persistPreferredBusinessId("biz_123");
    expect(readPreferredBusinessId()).toBe("biz_123");

    clearPreferredBusinessId();
    expect(readPreferredBusinessId()).toBeNull();
  });

  it("fails safely when window is not available", () => {
    expect(readPreferredBusinessId()).toBeNull();
    expect(() => persistPreferredBusinessId("biz_456")).not.toThrow();
    expect(() => clearPreferredBusinessId()).not.toThrow();
  });
});
