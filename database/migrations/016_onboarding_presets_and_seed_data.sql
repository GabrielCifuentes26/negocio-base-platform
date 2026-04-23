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
  initial_hours jsonb default '[]'::jsonb,
  seed_services jsonb default '[]'::jsonb,
  seed_products jsonb default '[]'::jsonb,
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
    coalesce(initial_hours, '[]'::jsonb)
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

  insert into public.services (
    business_id,
    name,
    description,
    duration_minutes,
    price,
    is_active
  )
  select
    generated_business_id,
    trim(service_item->>'name'),
    nullif(service_item->>'description', ''),
    coalesce((service_item->>'durationMinutes')::integer, 30),
    coalesce((service_item->>'price')::numeric, 0),
    true
  from jsonb_array_elements(coalesce(seed_services, '[]'::jsonb)) service_item
  where coalesce(trim(service_item->>'name'), '') <> '';

  insert into public.products (
    business_id,
    name,
    description,
    sku,
    price,
    stock,
    is_active
  )
  select
    generated_business_id,
    trim(product_item->>'name'),
    nullif(product_item->>'description', ''),
    nullif(product_item->>'sku', ''),
    coalesce((product_item->>'price')::numeric, 0),
    coalesce((product_item->>'stock')::integer, 0),
    true
  from jsonb_array_elements(coalesce(seed_products, '[]'::jsonb)) product_item
  where coalesce(trim(product_item->>'name'), '') <> '';

  update public.profiles
  set preferred_business_id = generated_business_id,
      updated_at = now()
  where id = current_profile.id;

  business_id := generated_business_id;
  membership_id := generated_membership_id;

  return next;
end;
$$;
