alter table public.profiles
add column if not exists email text;

create unique index if not exists profiles_email_unique
on public.profiles(email)
where email is not null;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create unique index if not exists roles_system_key_unique
on public.roles(key)
where business_id is null;

insert into public.roles (business_id, key, name, description, is_system)
values
  (null, 'owner', 'Owner', 'Acceso total', true),
  (null, 'admin', 'Admin', 'Operacion y configuracion', true),
  (null, 'manager', 'Manager', 'Operacion diaria y reportes', true),
  (null, 'staff', 'Staff', 'Agenda y atencion', true)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.business_id is null
  and r.key = 'owner'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('view_reports', 'manage_branding', 'manage_settings')
where r.business_id is null
  and r.key = 'admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('view_reports')
where r.business_id is null
  and r.key = 'manager'
on conflict do nothing;

drop policy if exists "role_permissions_access" on public.role_permissions;
create policy "role_permissions_access" on public.role_permissions
for all using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (r.business_id is null or public.user_has_business_access(r.business_id))
  )
)
with check (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (r.business_id is null or public.user_has_business_access(r.business_id))
  )
);
