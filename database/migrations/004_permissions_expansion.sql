insert into public.permissions (key, module_key, action, description)
values
  ('manage_users', 'users', 'write', 'Administrar usuarios'),
  ('manage_roles', 'roles', 'write', 'Administrar roles')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('manage_users', 'manage_roles')
where r.business_id is null
  and r.key in ('owner', 'admin')
on conflict do nothing;
