insert into public.permissions (key, module_key, action, description)
values
  ('dashboard.read', 'dashboard', 'read', 'Ver dashboard'),
  ('customers.read', 'customers', 'read', 'Ver clientes'),
  ('customers.create', 'customers', 'create', 'Crear clientes'),
  ('customers.update', 'customers', 'update', 'Editar clientes'),
  ('customers.delete', 'customers', 'delete', 'Eliminar clientes'),
  ('services.read', 'services', 'read', 'Ver servicios'),
  ('services.create', 'services', 'create', 'Crear servicios'),
  ('services.update', 'services', 'update', 'Editar servicios'),
  ('services.delete', 'services', 'delete', 'Eliminar servicios'),
  ('products.read', 'products', 'read', 'Ver productos'),
  ('products.create', 'products', 'create', 'Crear productos'),
  ('products.update', 'products', 'update', 'Editar productos'),
  ('products.delete', 'products', 'delete', 'Eliminar productos'),
  ('appointments.read', 'appointments', 'read', 'Ver citas y reservas'),
  ('appointments.create', 'appointments', 'create', 'Crear citas y reservas'),
  ('appointments.update', 'appointments', 'update', 'Editar citas y reservas'),
  ('appointments.delete', 'appointments', 'delete', 'Eliminar citas y reservas'),
  ('sales.read', 'sales', 'read', 'Ver ventas'),
  ('sales.create', 'sales', 'create', 'Registrar ventas'),
  ('sales.update', 'sales', 'update', 'Editar ventas'),
  ('sales.delete', 'sales', 'delete', 'Eliminar ventas'),
  ('users.read', 'users', 'read', 'Ver usuarios y empleados'),
  ('users.manage', 'users', 'manage', 'Administrar usuarios, membresias e invitaciones'),
  ('roles.read', 'roles', 'read', 'Ver roles y permisos'),
  ('roles.manage', 'roles', 'manage', 'Administrar roles y permisos'),
  ('settings.read', 'settings', 'read', 'Ver configuracion del negocio'),
  ('settings.update', 'settings', 'update', 'Editar configuracion del negocio'),
  ('branding.read', 'branding', 'read', 'Ver branding y tema'),
  ('branding.update', 'branding', 'update', 'Editar branding y assets'),
  ('reports.read', 'reports', 'read', 'Ver reportes')
on conflict (key) do nothing;

create or replace function public.user_has_any_permission(target_business_id uuid, permission_keys text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships bm
    join public.role_permissions rp on rp.role_id = bm.role_id
    join public.permissions p on p.id = rp.permission_id
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
      and (p.key = 'manage_all' or p.key = any(permission_keys))
  );
$$;

create or replace function public.user_can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_profile_id = auth.uid()
    or exists (
      select 1
      from public.business_memberships current_membership
      join public.business_memberships target_membership
        on target_membership.business_id = current_membership.business_id
      where current_membership.user_id = auth.uid()
        and current_membership.status = 'active'
        and target_membership.user_id = target_profile_id
        and target_membership.status = 'active'
        and public.user_has_any_permission(
          current_membership.business_id,
          array['users.read', 'users.manage', 'manage_users']
        )
    );
$$;

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
join public.permissions p
  on p.key in (
    'dashboard.read',
    'customers.read',
    'customers.create',
    'customers.update',
    'customers.delete',
    'services.read',
    'services.create',
    'services.update',
    'services.delete',
    'products.read',
    'products.create',
    'products.update',
    'products.delete',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'appointments.delete',
    'sales.read',
    'sales.create',
    'sales.update',
    'sales.delete',
    'users.read',
    'users.manage',
    'roles.read',
    'roles.manage',
    'settings.read',
    'settings.update',
    'branding.read',
    'branding.update',
    'reports.read'
  )
where r.business_id is null
  and r.key = 'admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.key in (
    'dashboard.read',
    'customers.read',
    'customers.create',
    'customers.update',
    'services.read',
    'services.create',
    'services.update',
    'products.read',
    'products.create',
    'products.update',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'sales.read',
    'sales.create',
    'sales.update',
    'users.read',
    'reports.read'
  )
where r.business_id is null
  and r.key = 'manager'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.key in (
    'dashboard.read',
    'customers.read',
    'customers.create',
    'customers.update',
    'services.read',
    'products.read',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'sales.read',
    'sales.create'
  )
where r.business_id is null
  and r.key = 'staff'
on conflict do nothing;

drop policy if exists "businesses_update_by_membership" on public.businesses;
create policy "businesses_update_with_settings_permission" on public.businesses
for update using (
  public.user_has_any_permission(id, array['settings.update', 'manage_settings'])
)
with check (
  public.user_has_any_permission(id, array['settings.update', 'manage_settings'])
);

drop policy if exists "business_branding_access" on public.business_branding;
drop policy if exists "business_branding_read" on public.business_branding;
drop policy if exists "business_branding_insert" on public.business_branding;
drop policy if exists "business_branding_update" on public.business_branding;
drop policy if exists "business_branding_delete" on public.business_branding;

create policy "business_branding_read" on public.business_branding
for select using (public.user_has_business_access(business_id));

create policy "business_branding_insert" on public.business_branding
for insert with check (
  public.user_has_any_permission(business_id, array['branding.update', 'manage_branding'])
);

create policy "business_branding_update" on public.business_branding
for update using (
  public.user_has_any_permission(business_id, array['branding.update', 'manage_branding'])
)
with check (
  public.user_has_any_permission(business_id, array['branding.update', 'manage_branding'])
);

create policy "business_branding_delete" on public.business_branding
for delete using (
  public.user_has_any_permission(business_id, array['branding.update', 'manage_branding'])
);

drop policy if exists "business_settings_access" on public.business_settings;
drop policy if exists "business_settings_read" on public.business_settings;
drop policy if exists "business_settings_insert" on public.business_settings;
drop policy if exists "business_settings_update" on public.business_settings;
drop policy if exists "business_settings_delete" on public.business_settings;

create policy "business_settings_read" on public.business_settings
for select using (public.user_has_business_access(business_id));

create policy "business_settings_insert" on public.business_settings
for insert with check (
  public.user_has_any_permission(business_id, array['settings.update', 'manage_settings'])
);

create policy "business_settings_update" on public.business_settings
for update using (
  public.user_has_any_permission(business_id, array['settings.update', 'manage_settings'])
)
with check (
  public.user_has_any_permission(business_id, array['settings.update', 'manage_settings'])
);

create policy "business_settings_delete" on public.business_settings
for delete using (
  public.user_has_any_permission(business_id, array['settings.update', 'manage_settings'])
);

drop policy if exists "roles_access" on public.roles;
drop policy if exists "roles_read" on public.roles;
drop policy if exists "roles_insert" on public.roles;
drop policy if exists "roles_update" on public.roles;
drop policy if exists "roles_delete" on public.roles;

create policy "roles_read" on public.roles
for select using (business_id is null or public.user_has_business_access(business_id));

create policy "roles_insert" on public.roles
for insert with check (
  business_id is not null
  and public.user_has_any_permission(business_id, array['roles.manage', 'manage_roles'])
);

create policy "roles_update" on public.roles
for update using (
  business_id is not null
  and public.user_has_any_permission(business_id, array['roles.manage', 'manage_roles'])
)
with check (
  business_id is not null
  and public.user_has_any_permission(business_id, array['roles.manage', 'manage_roles'])
);

create policy "roles_delete" on public.roles
for delete using (
  business_id is not null
  and public.user_has_any_permission(business_id, array['roles.manage', 'manage_roles'])
);

drop policy if exists "role_permissions_access" on public.role_permissions;
drop policy if exists "role_permissions_read" on public.role_permissions;
drop policy if exists "role_permissions_insert" on public.role_permissions;
drop policy if exists "role_permissions_delete" on public.role_permissions;

create policy "role_permissions_read" on public.role_permissions
for select using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (r.business_id is null or public.user_has_business_access(r.business_id))
  )
);

create policy "role_permissions_insert" on public.role_permissions
for insert with check (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.business_id is not null
      and public.user_has_any_permission(r.business_id, array['roles.manage', 'manage_roles'])
  )
);

create policy "role_permissions_delete" on public.role_permissions
for delete using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.business_id is not null
      and public.user_has_any_permission(r.business_id, array['roles.manage', 'manage_roles'])
  )
);

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_visible_team" on public.profiles;

create policy "profiles_select_visible_team" on public.profiles
for select using (public.user_can_view_profile(id));

drop policy if exists "business_memberships_select_own_or_business" on public.business_memberships;
drop policy if exists "business_memberships_read" on public.business_memberships;
drop policy if exists "business_memberships_update_manage_users" on public.business_memberships;

create policy "business_memberships_read" on public.business_memberships
for select using (user_id = auth.uid() or public.user_has_business_access(business_id));

create policy "business_memberships_update_manage_users" on public.business_memberships
for update using (
  public.user_has_any_permission(business_id, array['users.manage', 'manage_users'])
)
with check (
  public.user_has_any_permission(business_id, array['users.manage', 'manage_users'])
);

drop policy if exists "business_invitations_access" on public.business_invitations;
drop policy if exists "business_invitations_read" on public.business_invitations;
drop policy if exists "business_invitations_insert" on public.business_invitations;
drop policy if exists "business_invitations_update" on public.business_invitations;
drop policy if exists "business_invitations_delete" on public.business_invitations;

create policy "business_invitations_read" on public.business_invitations
for select using (public.user_has_business_access(business_id));

create policy "business_invitations_insert" on public.business_invitations
for insert with check (
  public.user_has_any_permission(business_id, array['users.manage', 'manage_users'])
);

create policy "business_invitations_update" on public.business_invitations
for update using (
  public.user_has_any_permission(business_id, array['users.manage', 'manage_users'])
)
with check (
  public.user_has_any_permission(business_id, array['users.manage', 'manage_users'])
);

create policy "business_invitations_delete" on public.business_invitations
for delete using (
  public.user_has_any_permission(business_id, array['users.manage', 'manage_users'])
);

create or replace function public.user_has_brand_asset_access(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  business_id_text text;
begin
  business_id_text := (storage.foldername(object_name))[1];

  if business_id_text is null then
    return false;
  end if;

  return public.user_has_any_permission(
    business_id_text::uuid,
    array['branding.update', 'manage_branding']
  );
exception
  when others then
    return false;
end;
$$;
