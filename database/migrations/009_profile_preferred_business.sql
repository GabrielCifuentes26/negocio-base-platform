alter table public.profiles
add column if not exists preferred_business_id uuid references public.businesses(id) on delete set null;

create or replace function public.set_preferred_business(target_business_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para actualizar el negocio preferido.';
  end if;

  if target_business_id is not null and not public.user_has_business_access(target_business_id) then
    raise exception 'No tienes acceso al negocio seleccionado.';
  end if;

  update public.profiles
  set preferred_business_id = target_business_id,
      updated_at = now()
  where id = auth.uid();

  return target_business_id;
end;
$$;
