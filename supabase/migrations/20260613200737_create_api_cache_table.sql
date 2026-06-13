create table if not exists public.api_cache (
    id uuid default gen_random_uuid() primary key,
    endpoint text not null unique,
    data jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Configurar RLS (Row Level Security)
-- Por defecto el acceso está denegado. Vamos a permitir que cualquier usuario autenticado (o anon)
-- pueda LEER el caché, ya que la UI o la Edge Function lo necesitará,
-- o bien la Edge Function usando service_role_key saltará estas políticas.
-- Para mayor seguridad, solo permitimos a la Service Role editar, y a autenticados leer.

alter table public.api_cache enable row level security;

create policy "Enable read access for all users" on public.api_cache
    for select
    using (true);

-- No permitimos inserts/updates/deletes desde el frontend (solo desde Edge Function con service_role_key)
