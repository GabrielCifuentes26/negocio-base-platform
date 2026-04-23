drop policy if exists "customers_access" on public.customers;
drop policy if exists "customers_read" on public.customers;
drop policy if exists "customers_insert" on public.customers;
drop policy if exists "customers_update" on public.customers;
drop policy if exists "customers_delete" on public.customers;

create policy "customers_read" on public.customers
for select using (public.user_has_business_access(business_id));

create policy "customers_insert" on public.customers
for insert with check (
  public.user_has_any_permission(business_id, array['customers.create'])
);

create policy "customers_update" on public.customers
for update using (
  public.user_has_any_permission(business_id, array['customers.update'])
)
with check (
  public.user_has_any_permission(business_id, array['customers.update'])
);

create policy "customers_delete" on public.customers
for delete using (
  public.user_has_any_permission(business_id, array['customers.delete'])
);

drop policy if exists "services_access" on public.services;
drop policy if exists "services_read" on public.services;
drop policy if exists "services_insert" on public.services;
drop policy if exists "services_update" on public.services;
drop policy if exists "services_delete" on public.services;

create policy "services_read" on public.services
for select using (public.user_has_business_access(business_id));

create policy "services_insert" on public.services
for insert with check (
  public.user_has_any_permission(business_id, array['services.create'])
);

create policy "services_update" on public.services
for update using (
  public.user_has_any_permission(business_id, array['services.update'])
)
with check (
  public.user_has_any_permission(business_id, array['services.update'])
);

create policy "services_delete" on public.services
for delete using (
  public.user_has_any_permission(business_id, array['services.delete'])
);

drop policy if exists "products_access" on public.products;
drop policy if exists "products_read" on public.products;
drop policy if exists "products_insert" on public.products;
drop policy if exists "products_update" on public.products;
drop policy if exists "products_delete" on public.products;

create policy "products_read" on public.products
for select using (public.user_has_business_access(business_id));

create policy "products_insert" on public.products
for insert with check (
  public.user_has_any_permission(business_id, array['products.create'])
);

create policy "products_update" on public.products
for update using (
  public.user_has_any_permission(business_id, array['products.update'])
)
with check (
  public.user_has_any_permission(business_id, array['products.update'])
);

create policy "products_delete" on public.products
for delete using (
  public.user_has_any_permission(business_id, array['products.delete'])
);

drop policy if exists "appointments_access" on public.appointments;
drop policy if exists "appointments_read" on public.appointments;
drop policy if exists "appointments_insert" on public.appointments;
drop policy if exists "appointments_update" on public.appointments;
drop policy if exists "appointments_delete" on public.appointments;

create policy "appointments_read" on public.appointments
for select using (public.user_has_business_access(business_id));

create policy "appointments_insert" on public.appointments
for insert with check (
  public.user_has_any_permission(business_id, array['appointments.create'])
);

create policy "appointments_update" on public.appointments
for update using (
  public.user_has_any_permission(business_id, array['appointments.update'])
)
with check (
  public.user_has_any_permission(business_id, array['appointments.update'])
);

create policy "appointments_delete" on public.appointments
for delete using (
  public.user_has_any_permission(business_id, array['appointments.delete'])
);

drop policy if exists "appointment_services_access" on public.appointment_services;
drop policy if exists "appointment_services_read" on public.appointment_services;
drop policy if exists "appointment_services_insert" on public.appointment_services;
drop policy if exists "appointment_services_update" on public.appointment_services;
drop policy if exists "appointment_services_delete" on public.appointment_services;

create policy "appointment_services_read" on public.appointment_services
for select using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_business_access(a.business_id)
  )
);

create policy "appointment_services_insert" on public.appointment_services
for insert with check (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_any_permission(a.business_id, array['appointments.create', 'appointments.update'])
  )
);

create policy "appointment_services_update" on public.appointment_services
for update using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_any_permission(a.business_id, array['appointments.update'])
  )
)
with check (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_any_permission(a.business_id, array['appointments.update'])
  )
);

create policy "appointment_services_delete" on public.appointment_services
for delete using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_any_permission(a.business_id, array['appointments.update', 'appointments.delete'])
  )
);

drop policy if exists "sales_access" on public.sales;
drop policy if exists "sales_read" on public.sales;
drop policy if exists "sales_insert" on public.sales;
drop policy if exists "sales_update" on public.sales;
drop policy if exists "sales_delete" on public.sales;

create policy "sales_read" on public.sales
for select using (public.user_has_business_access(business_id));

create policy "sales_insert" on public.sales
for insert with check (
  public.user_has_any_permission(business_id, array['sales.create'])
);

create policy "sales_update" on public.sales
for update using (
  public.user_has_any_permission(business_id, array['sales.update'])
)
with check (
  public.user_has_any_permission(business_id, array['sales.update'])
);

create policy "sales_delete" on public.sales
for delete using (
  public.user_has_any_permission(business_id, array['sales.delete'])
);

drop policy if exists "sale_items_access" on public.sale_items;
drop policy if exists "sale_items_read" on public.sale_items;
drop policy if exists "sale_items_insert" on public.sale_items;
drop policy if exists "sale_items_update" on public.sale_items;
drop policy if exists "sale_items_delete" on public.sale_items;

create policy "sale_items_read" on public.sale_items
for select using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_business_access(s.business_id)
  )
);

create policy "sale_items_insert" on public.sale_items
for insert with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_any_permission(s.business_id, array['sales.create', 'sales.update'])
  )
);

create policy "sale_items_update" on public.sale_items
for update using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_any_permission(s.business_id, array['sales.update'])
  )
)
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_any_permission(s.business_id, array['sales.update'])
  )
);

create policy "sale_items_delete" on public.sale_items
for delete using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_any_permission(s.business_id, array['sales.update', 'sales.delete'])
  )
);
