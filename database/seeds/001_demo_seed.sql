insert into public.permissions (key, module_key, action, description)
values
  ('manage_all', 'core', 'all', 'Acceso total'),
  ('view_reports', 'reports', 'read', 'Ver reportes'),
  ('manage_branding', 'branding', 'write', 'Administrar branding'),
  ('manage_settings', 'settings', 'write', 'Administrar configuracion'),
  ('manage_users', 'users', 'write', 'Administrar usuarios'),
  ('manage_roles', 'roles', 'write', 'Administrar roles')
on conflict (key) do nothing;
