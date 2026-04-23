drop function if exists public.get_workspace_report_snapshot(uuid, integer);

create or replace function public.get_workspace_report_snapshot(
  target_business_id uuid,
  range_days integer default 30,
  start_date date default null,
  end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_range integer := greatest(1, least(coalesce(range_days, 30), 365));
  range_start_date date;
  range_end_date date;
  previous_range_end_date date;
  previous_range_start_date date;
  total_revenue numeric := 0;
  appointments_count integer := 0;
  sales_count integer := 0;
  active_customers integer := 0;
  conversion_rate integer := 0;
  previous_revenue numeric := 0;
  previous_appointments_count integer := 0;
  previous_sales_count integer := 0;
  previous_active_customers integer := 0;
  previous_conversion_rate integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para consultar reportes.';
  end if;

  if not public.user_has_any_permission(target_business_id, array['reports.read']) then
    raise exception 'No tienes permisos para consultar reportes en este negocio.';
  end if;

  if start_date is not null and end_date is not null and end_date >= start_date then
    range_start_date := start_date;
    range_end_date := least(end_date, start_date + 364);
    effective_range := greatest(1, (range_end_date - range_start_date) + 1);
  else
    range_start_date := current_date - (effective_range - 1);
    range_end_date := current_date;
  end if;

  previous_range_end_date := range_start_date - 1;
  previous_range_start_date := previous_range_end_date - (effective_range - 1);

  select coalesce(sum(s.total), 0), count(*)
  into total_revenue, sales_count
  from public.sales s
  where s.business_id = target_business_id
    and (s.created_at at time zone 'UTC')::date between range_start_date and range_end_date;

  select count(*)
  into appointments_count
  from public.appointments a
  where a.business_id = target_business_id
    and (a.starts_at at time zone 'UTC')::date between range_start_date and range_end_date;

  select count(distinct customer_id)
  into active_customers
  from (
    select a.customer_id
    from public.appointments a
    where a.business_id = target_business_id
      and (a.starts_at at time zone 'UTC')::date between range_start_date and range_end_date
    union
    select s.customer_id
    from public.sales s
    where s.business_id = target_business_id
      and s.customer_id is not null
      and (s.created_at at time zone 'UTC')::date between range_start_date and range_end_date
  ) active_customer_ids;

  if appointments_count > 0 then
    conversion_rate := least(100, round((sales_count::numeric / appointments_count::numeric) * 100));
  end if;

  select coalesce(sum(s.total), 0), count(*)
  into previous_revenue, previous_sales_count
  from public.sales s
  where s.business_id = target_business_id
    and (s.created_at at time zone 'UTC')::date between previous_range_start_date and previous_range_end_date;

  select count(*)
  into previous_appointments_count
  from public.appointments a
  where a.business_id = target_business_id
    and (a.starts_at at time zone 'UTC')::date between previous_range_start_date and previous_range_end_date;

  select count(distinct customer_id)
  into previous_active_customers
  from (
    select a.customer_id
    from public.appointments a
    where a.business_id = target_business_id
      and (a.starts_at at time zone 'UTC')::date between previous_range_start_date and previous_range_end_date
    union
    select s.customer_id
    from public.sales s
    where s.business_id = target_business_id
      and s.customer_id is not null
      and (s.created_at at time zone 'UTC')::date between previous_range_start_date and previous_range_end_date
  ) previous_active_customer_ids;

  if previous_appointments_count > 0 then
    previous_conversion_rate := least(100, round((previous_sales_count::numeric / previous_appointments_count::numeric) * 100));
  end if;

  return jsonb_build_object(
    'rangeStart', range_start_date::text,
    'rangeEnd', range_end_date::text,
    'previousRangeStart', previous_range_start_date::text,
    'previousRangeEnd', previous_range_end_date::text,
    'metrics',
    jsonb_build_object(
      'revenue', total_revenue,
      'appointmentsCount', appointments_count,
      'activeCustomers', active_customers,
      'conversionRate', conversion_rate
    ),
    'previousMetrics',
    jsonb_build_object(
      'revenue', previous_revenue,
      'appointmentsCount', previous_appointments_count,
      'activeCustomers', previous_active_customers,
      'conversionRate', previous_conversion_rate
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
          order by item.starts_at desc
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
            and (a.starts_at at time zone 'UTC')::date between range_start_date and range_end_date
          order by a.starts_at desc
          limit 6
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
            and (s.created_at at time zone 'UTC')::date between range_start_date and range_end_date
          order by s.created_at desc
          limit 8
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
          from generate_series(range_start_date, range_end_date, interval '1 day') as day_bucket
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
