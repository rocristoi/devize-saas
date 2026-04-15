-- Create announcements table
create table public.announcements (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  image_url text,
  short_description text not null,
  body text not null
);

-- Enable RLS
alter table public.announcements enable row level security;

-- Allow read access to all authenticated users
create policy "Allow read access to authenticated users"
  on public.announcements for select
  to authenticated
  using (true);

-- Service role bypasses RLS automatically, so no need for insert/update/delete policies for admins.
