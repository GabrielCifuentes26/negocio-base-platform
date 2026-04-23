drop policy if exists "customers_read" on public.customers;
create policy "customers_read" on public.customers
for select using (
  public.user_has_any_permission(business_id, array['customers.read'])
);

drop policy if exists "services_read" on public.services;
create policy "services_read" on public.services
for select using (
  public.user_has_any_permission(business_id, array['services.read'])
);

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
for select using (
  public.user_has_any_permission(business_id, array['products.read'])
);

drop policy if exists "appointments_read" on public.appointments;
create policy "appointments_read" on public.appointments
for select using (
  public.user_has_any_permission(business_id, array['appointments.read'])
);

drop policy if exists "appointment_services_read" on public.appointment_services;
create policy "appointment_services_read" on public.appointment_services
for select using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_any_permission(a.business_id, array['appointments.read'])
  )
);

drop policy if exists "sales_read" on public.sales;
create policy "sales_read" on public.sales
for select using (
  public.user_has_any_permission(business_id, array['sales.read'])
);

drop policy if exists "sale_items_read" on public.sale_items;
create policy "sale_items_read" on public.sale_items
for select using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_any_permission(s.business_id, array['sales.read'])
  )
);
