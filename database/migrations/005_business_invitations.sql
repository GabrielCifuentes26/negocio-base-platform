create table if not exists public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null,
  full_name text,
  role_id uuid not null references public.roles(id) on delete restrict,
  invited_by_membership_id uuid references public.business_memberships(id) on delete set null,
  status text not null default 'pending',
  expires_at timestamptz,
  accepted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists business_invitations_active_email_unique
on public.business_invitations (business_id, email)
where status = 'pending';

alter table public.business_invitations enable row level security;

drop trigger if exists business_invitations_set_updated_at on public.business_invitations;
create trigger business_invitations_set_updated_at
before update on public.business_invitations
for each row execute function public.set_updated_at();

drop policy if exists "business_invitations_access" on public.business_invitations;
create policy "business_invitations_access" on public.business_invitations
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));
