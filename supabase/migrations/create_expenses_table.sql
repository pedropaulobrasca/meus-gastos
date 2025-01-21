-- Create the expenses table
create table public.expenses (
    id uuid default gen_random_uuid() primary key,
    description text not null,
    amount numeric not null,
    date timestamp with time zone not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now() not null
);

-- Enable RLS (Row Level Security)
alter table public.expenses enable row level security;

-- Create policy to allow users to read only their own expenses
create policy "Users can view their own expenses"
    on public.expenses
    for select
    using (auth.uid() = user_id);

-- Create policy to allow users to insert their own expenses
create policy "Users can insert their own expenses"
    on public.expenses
    for insert
    with check (auth.uid() = user_id);

-- Create policy to allow users to update their own expenses
create policy "Users can update their own expenses"
    on public.expenses
    for update
    using (auth.uid() = user_id);

-- Create policy to allow users to delete their own expenses
create policy "Users can delete their own expenses"
    on public.expenses
    for delete
    using (auth.uid() = user_id);

-- Create index for better query performance
create index expenses_user_id_idx on public.expenses(user_id);
create index expenses_date_idx on public.expenses(date);
