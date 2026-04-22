"use client";

import type { CSSProperties, ReactNode } from "react";

import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/auth/auth-context";
import { useBranding } from "@/hooks/use-branding";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemedApp>{children}</ThemedApp>
    </AuthProvider>
  );
}

function ThemedApp({ children }: { children: ReactNode }) {
  const themeVars = useBranding();

  return (
    <div style={themeVars as CSSProperties}>
      {children}
      <Toaster position="top-right" richColors />
    </div>
  );
}
