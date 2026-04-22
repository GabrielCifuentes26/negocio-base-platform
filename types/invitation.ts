export type InvitationListItem = {
  id: string;
  email: string;
  fullName: string | null;
  roleId: string;
  roleName: string;
  inviteToken: string;
  inviteLink: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  source: "demo" | "supabase";
};

export type CreateInvitationInput = {
  email: string;
  fullName?: string;
  roleId: string;
  notes?: string;
};

export type AcceptInvitationResult = {
  businessId: string | null;
  membershipId: string | null;
  error: string | null;
};
