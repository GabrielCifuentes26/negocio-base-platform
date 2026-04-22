insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do update
set public = excluded.public;

create or replace function public.user_has_brand_asset_access(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  business_id_text text;
begin
  business_id_text := (storage.foldername(object_name))[1];

  if business_id_text is null then
    return false;
  end if;

  return public.user_has_business_access(business_id_text::uuid);
exception
  when others then
    return false;
end;
$$;

drop policy if exists "brand_assets_public_read" on storage.objects;
create policy "brand_assets_public_read" on storage.objects
for select
to public
using (bucket_id = 'brand-assets');

drop policy if exists "brand_assets_insert" on storage.objects;
create policy "brand_assets_insert" on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'brand-assets'
  and public.user_has_brand_asset_access(name)
);

drop policy if exists "brand_assets_update" on storage.objects;
create policy "brand_assets_update" on storage.objects
for update
to authenticated
using (
  bucket_id = 'brand-assets'
  and public.user_has_brand_asset_access(name)
)
with check (
  bucket_id = 'brand-assets'
  and public.user_has_brand_asset_access(name)
);

drop policy if exists "brand_assets_delete" on storage.objects;
create policy "brand_assets_delete" on storage.objects
for delete
to authenticated
using (
  bucket_id = 'brand-assets'
  and public.user_has_brand_asset_access(name)
);
