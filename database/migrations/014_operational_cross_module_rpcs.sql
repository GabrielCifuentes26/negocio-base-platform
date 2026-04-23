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
            'description', s.duration_minutes::text || ' min'
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

create or replace function public.list_workspace_appointments(target_business_id uuid)
returns table (
  id uuid,
  customer_name text,
  service_name text,
  employee_name text,
  starts_at timestamptz,
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
    coalesce(service_lookup.name, 'Sin servicio') as service_name,
    coalesce(p.full_name, 'Sin asignar') as employee_name,
    a.starts_at,
    a.status
  from public.appointments a
  join public.customers c on c.id = a.customer_id
  left join lateral (
    select s.name
    from public.appointment_services aps
    join public.services s on s.id = aps.service_id
    where aps.appointment_id = a.id
    order by aps.created_at asc
    limit 1
  ) service_lookup on true
  left join public.business_memberships bm on bm.id = a.assigned_membership_id
  left join public.profiles p on p.id = bm.user_id
  where a.business_id = target_business_id
  order by a.starts_at asc;
end;
$$;

create or replace function public.create_workspace_appointment(
  target_business_id uuid,
  target_customer_id uuid,
  target_service_id uuid,
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
  selected_service public.services%rowtype;
  selected_customer public.customers%rowtype;
  assigned_membership public.business_memberships%rowtype;
  generated_appointment_id uuid;
  ends_at_value timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para crear citas.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['appointments.create']) then
    raise exception 'No tienes permisos para crear citas en este negocio.';
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

  select *
  into selected_service
  from public.services
  where id = target_service_id
    and business_id = target_business_id
    and is_active = true;

  if selected_service.id is null then
    raise exception 'El servicio seleccionado no pertenece al negocio o no esta activo.';
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

  ends_at_value := starts_at_value + make_interval(mins => selected_service.duration_minutes);

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
  values (
    generated_appointment_id,
    target_service_id,
    selected_service.price,
    1
  );

  appointment_id := generated_appointment_id;
  return next;
end;
$$;

create or replace function public.get_sale_form_options(target_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para consultar opciones de ventas.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['sales.read', 'sales.create', 'sales.update']) then
    raise exception 'No tienes permisos para consultar opciones de ventas en este negocio.';
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
    )
  );
end;
$$;

create or replace function public.list_workspace_sales(target_business_id uuid)
returns table (
  id uuid,
  ticket_number text,
  customer_name text,
  total numeric,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para consultar ventas.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['sales.read']) then
    raise exception 'No tienes permisos para consultar ventas en este negocio.';
  end if;

  return query
  select
    s.id,
    s.ticket_number,
    coalesce(c.full_name, 'Mostrador') as customer_name,
    s.total,
    s.status,
    s.created_at
  from public.sales s
  left join public.customers c on c.id = s.customer_id
  where s.business_id = target_business_id
  order by s.created_at desc;
end;
$$;

create or replace function public.create_workspace_sale(
  target_business_id uuid,
  sold_by_membership_id_value uuid default null,
  target_customer_id uuid default null,
  total_value numeric default 0,
  status_value text default 'paid',
  payment_method_value text default 'cash'
)
returns table (
  sale_id uuid,
  ticket_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_customer public.customers%rowtype;
  generated_sale_id uuid;
  generated_ticket_number text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para crear ventas.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['sales.create']) then
    raise exception 'No tienes permisos para crear ventas en este negocio.';
  end if;

  if total_value is null or total_value <= 0 then
    raise exception 'El total de la venta debe ser mayor que cero.';
  end if;

  if target_customer_id is not null then
    select *
    into selected_customer
    from public.customers
    where id = target_customer_id
      and business_id = target_business_id
      and is_active = true;

    if selected_customer.id is null then
      raise exception 'El cliente seleccionado no pertenece al negocio o no esta activo.';
    end if;
  end if;

  generated_ticket_number := 'TK-' || to_char(now(), 'YYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.sales (
    business_id,
    customer_id,
    sold_by_membership_id,
    ticket_number,
    status,
    subtotal,
    discount_total,
    tax_total,
    total,
    payment_method
  )
  values (
    target_business_id,
    target_customer_id,
    sold_by_membership_id_value,
    generated_ticket_number,
    coalesce(nullif(status_value, ''), 'paid'),
    total_value,
    0,
    0,
    total_value,
    coalesce(nullif(payment_method_value, ''), 'cash')
  )
  returning id, public.sales.ticket_number
  into generated_sale_id, ticket_number;

  sale_id := generated_sale_id;
  return next;
end;
$$;
