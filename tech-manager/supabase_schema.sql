
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  email text,
  role text default 'technician' check (role in ('admin', 'technician')),
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for service_orders
create table service_orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  date timestamp with time zone not null,
  status text not null default 'pending' check (status in ('pending', 'in-progress', 'completed', 'cancelled')),
  location jsonb, -- { lat: number, lng: number, address: string }
  assigned_technician_id uuid references profiles(id) on delete set null,
  created_by uuid references auth.users(id)
);

-- Set up RLS for service_orders
alter table service_orders enable row level security;

create policy "Service orders are viewable by everyone (authenticated)." on service_orders
  for select using (auth.role() = 'authenticated');

create policy "Admins can insert service orders." on service_orders
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update service orders." on service_orders
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Technicians can update status of assigned orders." on service_orders
  for update using (
    auth.uid() = assigned_technician_id
  ) with check (
    auth.uid() = assigned_technician_id
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    coalesce(new.raw_user_meta_data->>'role', 'technician')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
