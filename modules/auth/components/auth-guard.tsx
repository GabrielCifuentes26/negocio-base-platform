"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ModuleLoader } from "@/components/states/module-loader";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, supabaseEnabled, workspace } = useAuth();

  useEffect(() => {
    if (!supabaseEnabled || status !== "unauthenticated") {
      return;
    }

    const nextPath = pathname || "/dashboard";
    router.replace(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }, [pathname, router, status, supabaseEnabled]);

  useEffect(() => {
    if (!supabaseEnabled || status !== "authenticated" || workspace) {
      return;
    }

    router.replace("/onboarding");
  }, [router, status, supabaseEnabled, workspace]);

  if (!supabaseEnabled || status === "demo") {
    return <>{children}</>;
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <ModuleLoader />
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <ModuleLoader />
      </main>
    );
  }

  return <>{children}</>;
}
