create or replace function public.get_appointment_form_options(target_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para consultar opciones de citas.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['appointments.read', 'appointments.create', 'appointments.update']) then
    raise exception 'No tienes permisos para consultar opciones de citas en este negocio.';
  end if;

  return jsonb_build_object(
    'customers',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'value', c.id::text,
            'label', c.full_name,
            'description', c.phone
          )
          order by c.full_name
        )
        from public.customers c
        where c.business_id = target_business_id
          and c.is_active = true
      ),
      '[]'::jsonb
    ),
    'services',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'value', s.id::text,
            'label', s.name,
            'description', s.duration_minutes::text || ' min · ' || s.price::text,
            'durationMinutes', s.duration_minutes,
            'price', s.price
          )
          order by s.name
        )
        from public.services s
        where s.business_id = target_business_id
          and s.is_active = true
      ),
      '[]'::jsonb
    ),
    'employees',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'value', bm.id::text,
            'label', p.full_name,
            'description', r.name
          )
          order by p.full_name
        )
        from public.business_memberships bm
        join public.profiles p on p.id = bm.user_id
        join public.roles r on r.id = bm.role_id
        where bm.business_id = target_business_id
          and bm.status = 'active'
      ),
      '[]'::jsonb
    )
  );
end;
$$;

drop function if exists public.list_workspace_appointments(uuid);

create or replace function public.list_workspace_appointments(target_business_id uuid)
returns table (
  id uuid,
  customer_name text,
  service_name text,
  service_count integer,
  employee_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para consultar citas.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['appointments.read']) then
    raise exception 'No tienes permisos para consultar citas en este negocio.';
  end if;

  return query
  select
    a.id,
    c.full_name as customer_name,
    coalesce(service_lookup.service_names, 'Sin servicio') as service_name,
    coalesce(service_lookup.service_count, 0)::integer as service_count,
    coalesce(p.full_name, 'Sin asignar') as employee_name,
    a.starts_at,
    a.ends_at,
    a.status
  from public.appointments a
  join public.customers c on c.id = a.customer_id
  left join lateral (
    select
      string_agg(s.name, ' + ' order by s.name) as service_names,
      count(*) as service_count
    from public.appointment_services aps
    join public.services s on s.id = aps.service_id
    where aps.appointment_id = a.id
  ) service_lookup on true
  left join public.business_memberships bm on bm.id = a.assigned_membership_id
  left join public.profiles p on p.id = bm.user_id
  where a.business_id = target_business_id
  order by a.starts_at asc;
end;
$$;

drop function if exists public.create_workspace_appointment(uuid, uuid, uuid, timestamptz, uuid, text, text);

create or replace function public.create_workspace_appointment(
  target_business_id uuid,
  target_customer_id uuid,
  target_service_ids uuid[],
  starts_at_value timestamptz,
  assigned_membership_id_value uuid default null,
  notes_value text default null,
  status_value text default 'pending'
)
returns table (
  appointment_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_customer public.customers%rowtype;
  assigned_membership public.business_memberships%rowtype;
  distinct_service_ids uuid[] := array(
    select distinct service_id
    from unnest(coalesce(target_service_ids, '{}'::uuid[])) as service_id
  );
  selected_services_count integer := 0;
  total_duration integer := 0;
  generated_appointment_id uuid;
  ends_at_value timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para crear citas.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['appointments.create']) then
    raise exception 'No tienes permisos para crear citas en este negocio.';
  end if;

  if coalesce(array_length(distinct_service_ids, 1), 0) = 0 then
    raise exception 'Debes seleccionar al menos un servicio.';
  end if;

  select *
  into selected_customer
  from public.customers
  where id = target_customer_id
    and business_id = target_business_id
    and is_active = true;

  if selected_customer.id is null then
    raise exception 'El cliente seleccionado no pertenece al negocio o no esta activo.';
  end if;

  select count(*), coalesce(sum(duration_minutes), 0)
  into selected_services_count, total_duration
  from public.services
  where id = any(distinct_service_ids)
    and business_id = target_business_id
    and is_active = true;

  if selected_services_count <> array_length(distinct_service_ids, 1) then
    raise exception 'Uno o varios servicios no pertenecen al negocio o no estan activos.';
  end if;

  if assigned_membership_id_value is not null then
    select *
    into assigned_membership
    from public.business_memberships
    where id = assigned_membership_id_value
      and business_id = target_business_id
      and status = 'active';

    if assigned_membership.id is null then
      raise exception 'La membresia asignada no pertenece al negocio o no esta activa.';
    end if;
  end if;

  ends_at_value := starts_at_value + make_interval(mins => total_duration);

  insert into public.appointments (
    business_id,
    customer_id,
    assigned_membership_id,
    starts_at,
    ends_at,
    status,
    notes
  )
  values (
    target_business_id,
    target_customer_id,
    assigned_membership_id_value,
    starts_at_value,
    ends_at_value,
    coalesce(nullif(status_value, ''), 'pending'),
    nullif(notes_value, '')
  )
  returning id into generated_appointment_id;

  insert into public.appointment_services (
    appointment_id,
    service_id,
    unit_price,
    quantity
  )
  select
    generated_appointment_id,
    s.id,
    s.price,
    1
  from public.services s
  where s.id = any(distinct_service_ids)
    and s.business_id = target_business_id
    and s.is_active = true;

  appointment_id := generated_appointment_id;
  return next;
end;
$$;
