create table if not exists public.group_predictions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    group_name text not null,
    first_place_code text not null,
    second_place_code text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, group_name)
);

alter table public.group_predictions enable row level security;

create policy "Users can view their own group predictions"
    on public.group_predictions for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own group predictions"
    on public.group_predictions for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own group predictions"
    on public.group_predictions for update
    using ( auth.uid() = user_id );
