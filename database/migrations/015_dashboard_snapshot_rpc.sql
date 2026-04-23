create or replace function public.get_workspace_dashboard_snapshot(target_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  total_revenue numeric := 0;
  appointments_today integer := 0;
  active_customers integer := 0;
  appointments_count integer := 0;
  sales_count integer := 0;
  conversion_rate integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para consultar el dashboard.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['dashboard.read', 'reports.read']) then
    raise exception 'No tienes permisos para consultar el dashboard de este negocio.';
  end if;

  select coalesce(sum(s.total), 0), count(*)
  into total_revenue, sales_count
  from public.sales s
  where s.business_id = target_business_id;

  select count(*)
  into appointments_today
  from public.appointments a
  where a.business_id = target_business_id
    and (a.starts_at at time zone 'UTC')::date = (now() at time zone 'UTC')::date;

  select count(*)
  into appointments_count
  from public.appointments a
  where a.business_id = target_business_id;

  select count(*)
  into active_customers
  from public.customers c
  where c.business_id = target_business_id
    and c.is_active = true;

  if appointments_count > 0 then
    conversion_rate := least(100, round((sales_count::numeric / appointments_count::numeric) * 100));
  end if;

  return jsonb_build_object(
    'metrics',
    jsonb_build_object(
      'revenue', total_revenue,
      'appointmentsToday', appointments_today,
      'activeCustomers', active_customers,
      'conversionRate', conversion_rate
    ),
    'appointments',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', item.id::text,
            'customer', item.customer_name,
            'service', item.service_name,
            'employee', item.employee_name,
            'time', item.time_label,
            'startsAt', item.starts_at,
            'status', item.status_label,
            'source', 'supabase'
          )
          order by item.starts_at asc
        )
        from (
          select
            a.id,
            c.full_name as customer_name,
            coalesce(service_lookup.name, 'Sin servicio') as service_name,
            coalesce(p.full_name, 'Sin asignar') as employee_name,
            a.starts_at,
            to_char(a.starts_at at time zone 'UTC', 'HH24:MI') as time_label,
            initcap(replace(a.status, '_', ' ')) as status_label
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
          order by a.starts_at asc
          limit 4
        ) item
      ),
      '[]'::jsonb
    ),
    'sales',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', item.id::text,
            'ticket', item.ticket_number,
            'customer', item.customer_name,
            'total', item.total,
            'status', item.status_label,
            'createdAt', item.created_at,
            'source', 'supabase'
          )
          order by item.created_at desc
        )
        from (
          select
            s.id,
            s.ticket_number,
            coalesce(c.full_name, 'Mostrador') as customer_name,
            s.total,
            initcap(replace(s.status, '_', ' ')) as status_label,
            s.created_at
          from public.sales s
          left join public.customers c on c.id = s.customer_id
          where s.business_id = target_business_id
          order by s.created_at desc
          limit 5
        ) item
      ),
      '[]'::jsonb
    ),
    'trend',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', trend_item.day_date,
            'revenue', trend_item.revenue
          )
          order by trend_item.day_date asc
        )
        from (
          select
            day_bucket::date as day_date,
            coalesce(sum(s.total), 0) as revenue
          from generate_series(current_date - 5, current_date, interval '1 day') as day_bucket
          left join public.sales s
            on s.business_id = target_business_id
           and (s.created_at at time zone 'UTC')::date = day_bucket::date
          group by day_bucket
          order by day_bucket asc
        ) trend_item
      ),
      '[]'::jsonb
    )
  );
end;
$$;
