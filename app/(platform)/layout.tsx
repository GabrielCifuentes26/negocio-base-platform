import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/modules/auth/components/auth-guard";
import { ModuleAccessGuard } from "@/modules/auth/components/module-access-guard";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <ModuleAccessGuard>
        <AppShell>{children}</AppShell>
      </ModuleAccessGuard>
    </AuthGuard>
  );
}
