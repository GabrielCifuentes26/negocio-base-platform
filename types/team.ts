export type TeamMemberListItem = {
  id: string;
  membershipId: string;
  roleId: string | null;
  name: string;
  email: string | null;
  role: string;
  status: string;
  joinedAt: string;
  source: "demo" | "supabase";
};
