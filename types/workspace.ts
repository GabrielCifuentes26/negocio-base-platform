import type { AuthUser, PermissionKey } from "@/types/auth";
import type { BusinessConfig } from "@/types/business";

export type WorkspaceRole = {
  id: string | null;
  key: string;
  name: string;
};

export type WorkspaceSummary = {
  mode: "demo" | "supabase";
  membershipId: string | null;
  businessId: string;
  businessName: string;
  logoText: string;
  role: WorkspaceRole;
};

export type ActiveWorkspace = {
  mode: "demo" | "supabase";
  membershipId: string | null;
  businessId: string;
  business: BusinessConfig;
  role: WorkspaceRole;
  user: AuthUser;
  permissions: PermissionKey[];
};

export type WorkspaceBundle = {
  workspace: ActiveWorkspace | null;
  workspaces: WorkspaceSummary[];
};
