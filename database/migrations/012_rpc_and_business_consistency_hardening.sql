create or replace function public.ensure_role_matches_business()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  role_business_id uuid;
begin
  select business_id
  into role_business_id
  from public.roles
  where id = new.role_id;

  if role_business_id is not null and role_business_id <> new.business_id then
    raise exception 'El rol seleccionado no pertenece al negocio indicado.';
  end if;

  return new;
end;
$$;

drop trigger if exists business_memberships_validate_role_scope on public.business_memberships;
create trigger business_memberships_validate_role_scope
before insert or update on public.business_memberships
for each row execute function public.ensure_role_matches_business();

drop trigger if exists business_invitations_validate_role_scope on public.business_invitations;
create trigger business_invitations_validate_role_scope
before insert or update on public.business_invitations
for each row execute function public.ensure_role_matches_business();

create or replace function public.ensure_invitation_membership_matches_business()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  membership_business_id uuid;
begin
  if new.invited_by_membership_id is null then
    return new;
  end if;

  select business_id
  into membership_business_id
  from public.business_memberships
  where id = new.invited_by_membership_id;

  if membership_business_id is null or membership_business_id <> new.business_id then
    raise exception 'La membresia invitadora no pertenece al negocio indicado.';
  end if;

  return new;
end;
$$;

drop trigger if exists business_invitations_validate_membership_scope on public.business_invitations;
create trigger business_invitations_validate_membership_scope
before insert or update on public.business_invitations
for each row execute function public.ensure_invitation_membership_matches_business();

create or replace function public.ensure_assigned_membership_matches_business()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  membership_business_id uuid;
begin
  if new.assigned_membership_id is null then
    return new;
  end if;

  select business_id
  into membership_business_id
  from public.business_memberships
  where id = new.assigned_membership_id;

  if membership_business_id is null or membership_business_id <> new.business_id then
    raise exception 'La membresia asignada no pertenece al negocio indicado.';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_validate_assigned_membership on public.appointments;
create trigger appointments_validate_assigned_membership
before insert or update on public.appointments
for each row execute function public.ensure_assigned_membership_matches_business();

create or replace function public.ensure_sale_membership_matches_business()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  membership_business_id uuid;
begin
  if new.sold_by_membership_id is null then
    return new;
  end if;

  select business_id
  into membership_business_id
  from public.business_memberships
  where id = new.sold_by_membership_id;

  if membership_business_id is null or membership_business_id <> new.business_id then
    raise exception 'La membresia vendedora no pertenece al negocio indicado.';
  end if;

  return new;
end;
$$;

drop trigger if exists sales_validate_membership_scope on public.sales;
create trigger sales_validate_membership_scope
before insert or update on public.sales
for each row execute function public.ensure_sale_membership_matches_business();

create or replace function public.bootstrap_business_workspace(
  business_name text,
  contact_email text default null,
  contact_phone text default null,
  address text default null,
  welcome_message text default null,
  locale_value text default 'es-GT',
  currency_code_value text default 'GTQ',
  timezone_value text default 'America/Guatemala',
  active_modules jsonb default '[]'::jsonb,
  primary_color text default '#0f766e',
  accent_color text default '#fef3c7',
  font_family text default 'Manrope'
)
returns table (
  business_id uuid,
  membership_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  owner_role_id uuid;
  generated_business_id uuid;
  generated_membership_id uuid;
  base_slug text;
  generated_slug text;
  suffix_number integer := 1;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para crear un negocio.';
  end if;

  if coalesce(trim(business_name), '') = '' then
    raise exception 'El nombre del negocio es obligatorio.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = auth.uid();

  if current_profile.id is null then
    raise exception 'No se encontro el perfil del usuario actual.';
  end if;

  select id
  into owner_role_id
  from public.roles
  where business_id is null
    and key = 'owner'
  limit 1;

  if owner_role_id is null then
    raise exception 'No se encontro el rol owner del sistema.';
  end if;

  base_slug := coalesce(nullif(public.slugify_text(business_name), ''), 'negocio');
  generated_slug := base_slug;

  while exists (
    select 1
    from public.businesses
    where slug = generated_slug
  ) loop
    suffix_number := suffix_number + 1;
    generated_slug := base_slug || '-' || suffix_number::text;
  end loop;

  insert into public.businesses (
    name,
    slug,
    locale,
    currency_code,
    timezone,
    status
  )
  values (
    trim(business_name),
    generated_slug,
    coalesce(nullif(locale_value, ''), 'es-GT'),
    coalesce(nullif(currency_code_value, ''), 'GTQ'),
    coalesce(nullif(timezone_value, ''), 'America/Guatemala'),
    'active'
  )
  returning id into generated_business_id;

  insert into public.business_branding (
    business_id,
    primary_color,
    primary_foreground_color,
    accent_color,
    accent_foreground_color,
    sidebar_color,
    font_family
  )
  values (
    generated_business_id,
    coalesce(nullif(primary_color, ''), '#0f766e'),
    '#f8fffd',
    coalesce(nullif(accent_color, ''), '#fef3c7'),
    '#92400e',
    '#fffdf7',
    coalesce(nullif(font_family, ''), 'Manrope')
  );

  insert into public.business_settings (
    business_id,
    contact_email,
    contact_phone,
    address,
    welcome_message,
    modules,
    hours
  )
  values (
    generated_business_id,
    nullif(contact_email, ''),
    nullif(contact_phone, ''),
    nullif(address, ''),
    nullif(welcome_message, ''),
    coalesce(active_modules, '[]'::jsonb),
    '[]'::jsonb
  );

  insert into public.business_memberships (
    business_id,
    user_id,
    role_id,
    status
  )
  values (
    generated_business_id,
    current_profile.id,
    owner_role_id,
    'active'
  )
  returning id into generated_membership_id;

  update public.profiles
  set preferred_business_id = generated_business_id,
      updated_at = now()
  where id = current_profile.id;

  business_id := generated_business_id;
  membership_id := generated_membership_id;

  return next;
end;
$$;

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
  target_role_business_id uuid;
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

  select business_id
  into target_role_business_id
  from public.roles
  where id = target_invitation.role_id;

  if target_role_business_id is not null and target_role_business_id <> target_invitation.business_id then
    raise exception 'El rol asignado en la invitacion no pertenece al negocio.';
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

  update public.profiles
  set preferred_business_id = business_id,
      updated_at = now()
  where id = current_profile.id;

  if coalesce(current_profile.full_name, '') = '' and target_invitation.full_name is not null then
    update public.profiles
    set full_name = target_invitation.full_name,
        updated_at = now()
    where id = current_profile.id;
  end if;

  return next;
end;
$$;
