alter table public.business_invitations
add column if not exists invite_token text;

alter table public.business_invitations
add column if not exists accepted_by_profile_id uuid references public.profiles(id) on delete set null;

update public.business_invitations
set invite_token = encode(gen_random_bytes(24), 'hex')
where invite_token is null;

alter table public.business_invitations
alter column invite_token set not null;

create unique index if not exists business_invitations_invite_token_unique
on public.business_invitations (invite_token);

create or replace function public.accept_business_invitation(invitation_token text)
returns table (
  business_id uuid,
  membership_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invitation public.business_invitations%rowtype;
  current_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para aceptar la invitacion.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = auth.uid();

  if current_profile.id is null then
    raise exception 'No se encontro el perfil del usuario actual.';
  end if;

  if current_profile.email is null then
    raise exception 'Tu perfil no tiene correo registrado.';
  end if;

  select *
  into target_invitation
  from public.business_invitations
  where invite_token = invitation_token
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  limit 1;

  if target_invitation.id is null then
    raise exception 'La invitacion no existe, ya fue usada o ha expirado.';
  end if;

  if lower(target_invitation.email) <> lower(current_profile.email) then
    raise exception 'El correo del usuario actual no coincide con la invitacion.';
  end if;

  insert into public.business_memberships (business_id, user_id, role_id, status)
  values (
    target_invitation.business_id,
    current_profile.id,
    target_invitation.role_id,
    'active'
  )
  on conflict (business_id, user_id)
  do update
    set role_id = excluded.role_id,
        status = 'active',
        updated_at = now()
  returning public.business_memberships.id, public.business_memberships.business_id
  into membership_id, business_id;

  update public.business_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_by_profile_id = current_profile.id,
      updated_at = now()
  where id = target_invitation.id;

  if coalesce(current_profile.full_name, '') = '' and target_invitation.full_name is not null then
    update public.profiles
    set full_name = target_invitation.full_name,
        updated_at = now()
    where id = current_profile.id;
  end if;

  return next;
end;
$$;
