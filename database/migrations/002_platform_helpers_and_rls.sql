create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists business_branding_set_updated_at on public.business_branding;
create trigger business_branding_set_updated_at
before update on public.business_branding
for each row execute function public.set_updated_at();

drop trigger if exists business_settings_set_updated_at on public.business_settings;
create trigger business_settings_set_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

drop trigger if exists roles_set_updated_at on public.roles;
create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists business_memberships_set_updated_at on public.business_memberships;
create trigger business_memberships_set_updated_at
before update on public.business_memberships
for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

create or replace function public.user_has_business_access(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
  );
$$;

create or replace function public.user_has_membership(target_membership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships bm
    where bm.id = target_membership_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
  );
$$;

drop policy if exists "businesses_select_by_membership" on public.businesses;
create policy "businesses_select_by_membership" on public.businesses
for select using (public.user_has_business_access(id));

drop policy if exists "businesses_update_by_membership" on public.businesses;
create policy "businesses_update_by_membership" on public.businesses
for update using (public.user_has_business_access(id))
with check (public.user_has_business_access(id));

drop policy if exists "business_branding_access" on public.business_branding;
create policy "business_branding_access" on public.business_branding
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));

drop policy if exists "business_settings_access" on public.business_settings;
create policy "business_settings_access" on public.business_settings
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));

drop policy if exists "roles_access" on public.roles;
create policy "roles_access" on public.roles
for all using (business_id is null or public.user_has_business_access(business_id))
with check (business_id is null or public.user_has_business_access(business_id));

drop policy if exists "permissions_read_authenticated" on public.permissions;
create policy "permissions_read_authenticated" on public.permissions
for select using (auth.role() = 'authenticated');

drop policy if exists "role_permissions_access" on public.role_permissions;
create policy "role_permissions_access" on public.role_permissions
for select using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (r.business_id is null or public.user_has_business_access(r.business_id))
  )
);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "business_memberships_select_own_or_business" on public.business_memberships;
create policy "business_memberships_select_own_or_business" on public.business_memberships
for select using (user_id = auth.uid() or public.user_has_business_access(business_id));

drop policy if exists "customers_access" on public.customers;
create policy "customers_access" on public.customers
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));

drop policy if exists "services_access" on public.services;
create policy "services_access" on public.services
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));

drop policy if exists "products_access" on public.products;
create policy "products_access" on public.products
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));

drop policy if exists "appointments_access" on public.appointments;
create policy "appointments_access" on public.appointments
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));

drop policy if exists "appointment_services_access" on public.appointment_services;
create policy "appointment_services_access" on public.appointment_services
for all using (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_business_access(a.business_id)
  )
)
with check (
  exists (
    select 1
    from public.appointments a
    where a.id = appointment_services.appointment_id
      and public.user_has_business_access(a.business_id)
  )
);

drop policy if exists "sales_access" on public.sales;
create policy "sales_access" on public.sales
for all using (public.user_has_business_access(business_id))
with check (public.user_has_business_access(business_id));

drop policy if exists "sale_items_access" on public.sale_items;
create policy "sale_items_access" on public.sale_items
for all using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_business_access(s.business_id)
  )
)
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_items.sale_id
      and public.user_has_business_access(s.business_id)
  )
);
