-- Create categories table for better expense organization
create table public.categories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now() not null
);

-- Enable RLS for categories
alter table public.categories enable row level security;

-- Categories policies
create policy "Users can view their own categories"
    on public.categories
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own categories"
    on public.categories
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own categories"
    on public.categories
    for update
    using (auth.uid() = user_id);

create policy "Users can delete their own categories"
    on public.categories
    for delete
    using (auth.uid() = user_id);

-- Create monthly_reports table for caching monthly totals
create table public.monthly_reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    year integer not null,
    month integer not null,
    total_amount numeric not null,
    total_expenses integer not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint month_range check (month between 1 and 12)
);

-- Enable RLS for monthly_reports
alter table public.monthly_reports enable row level security;

-- Monthly reports policies
create policy "Users can view their own monthly reports"
    on public.monthly_reports
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own monthly reports"
    on public.monthly_reports
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own monthly reports"
    on public.monthly_reports
    for update
    using (auth.uid() = user_id);

-- Add category_id to expenses table
alter table public.expenses 
add column category_id uuid references public.categories(id) on delete set null;

-- Create indexes
create unique index categories_name_user_id_idx on public.categories(name, user_id);
create unique index monthly_reports_year_month_user_id_idx on public.monthly_reports(year, month, user_id);

-- Create function to update monthly reports
create or replace function update_monthly_report()
returns trigger as $$
begin
    insert into public.monthly_reports (user_id, year, month, total_amount, total_expenses)
    select 
        user_id,
        extract(year from date)::integer as year,
        extract(month from date)::integer as month,
        sum(amount) as total_amount,
        count(*) as total_expenses
    from public.expenses
    where user_id = NEW.user_id
        and extract(year from date) = extract(year from NEW.date)
        and extract(month from date) = extract(month from NEW.date)
    group by user_id, extract(year from date), extract(month from date)
    on conflict (year, month, user_id) do update
    set 
        total_amount = excluded.total_amount,
        total_expenses = excluded.total_expenses,
        updated_at = now();
    return NEW;
end;
$$ language plpgsql;

-- Create trigger to update monthly reports
create trigger expenses_update_monthly_report
    after insert or update or delete
    on public.expenses
    for each row
    execute function update_monthly_report();
